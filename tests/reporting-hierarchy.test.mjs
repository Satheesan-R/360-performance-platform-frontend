import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

function module(file, imports = {}) {
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const context = { exports: {}, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const response = module("../lib/organization-hierarchy-response.ts");
const graph = module("../lib/organization-hierarchy.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const raw = { _id: "member", employeeNumber: "EMP-003", firstName: "Alex", lastName: "Example", jobTitle: "Engineer", departmentId: { _id: "engineering", name: "Engineering" }, teamId: { _id: "frontend", name: "Frontend" }, managerId: { _id: "lead", firstName: "Team", lastName: "Lead" } };
const employee = (id, manager = null, extra = {}) => ({ _id: id, fullName: id, reportingManagerId: manager, ...extra });
const employees = [
  employee("head", null, { departmentId: "leadership", departmentName: "Leadership" }),
  employee("lead", "head", { departmentId: "engineering", departmentName: "Engineering", teamId: "frontend", teamName: "Frontend" }),
  employee("member", "lead", { employeeNumber: "EMP-003", departmentId: "engineering", departmentName: "Engineering", teamId: "frontend", teamName: "Frontend" }),
  employee("other", null, { departmentId: "finance", departmentName: "Finance" }),
];

test("normalizes actual populated employee names job titles teams and manager IDs", () => {
  const result = response.parseHierarchyEmployees([raw])[0];
  assert.equal(result.fullName, "Alex Example");
  assert.equal(result.designation, "Engineer");
  assert.equal(result.employeeNumber, "EMP-003");
  assert.equal(result.departmentId, "engineering");
  assert.equal(result.departmentName, "Engineering");
  assert.equal(result.teamId, "frontend");
  assert.equal(result.teamName, "Frontend");
  assert.equal(result.reportingManagerId, "lead");
  assert.equal(result.reportingManagerName, "Team Lead");
});

test("raw relationship IDs and explicit null manager values are respected", () => {
  const result = response.parseHierarchyEmployees([{ ...raw, departmentId: "engineering", teamId: null, managerId: null, reportingManagerId: "stale" }])[0];
  assert.equal(result.reportingManagerId, null);
  assert.equal(result.departmentId, "engineering");
  assert.equal(result.teamId, "");
});

test("legacy normalized records remain compatible and invalid employee IDs fail visibly", () => {
  const result = response.parseHierarchyEmployees([employee("legacy", "boss", { designation: "Analyst", departmentName: "Finance" })])[0];
  assert.equal(result.fullName, "legacy");
  assert.equal(result.reportingManagerId, "boss");
  assert.equal(result.designation, "Analyst");
  assert.throws(() => response.parseHierarchyEmployees([{}]), /invalid employee record/);
});

test("search keeps all ancestors including managers outside the selected department", () => {
  const rows = graph.visibleHierarchyRows(employees, { search: "EMP-003", department: "engineering", team: "frontend" });
  assert.deepEqual(plain(rows.map((row) => row.employee._id)), ["head", "lead", "member"]);
  assert.deepEqual(plain(rows.filter((row) => row.contextOnly).map((row) => row.employee._id)), ["head", "lead"]);
  assert.equal(rows.find((row) => row.employee._id === "member").depth, 2);
});

test("filters never hide cycles or loop while retaining reporting context", () => {
  const cyclic = [employee("a", "b"), employee("b", "a")];
  const rows = graph.visibleHierarchyRows(cyclic, { search: "a", department: "", team: "" });
  assert.equal(rows.length, 2);
  assert.equal(rows.every((row) => row.disconnected), true);
  assert.equal(graph.visibleHierarchyRows(employees, { search: "not-found", department: "", team: "" }).length, 0);
});

test("manager candidates exclude self descendants cycles and missing-manager chains", () => {
  const data = [...employees, employee("cycle-a", "cycle-b"), employee("cycle-b", "cycle-a"), employee("orphan", "missing")];
  assert.deepEqual(plain(graph.reportingManagerChoices(data, "lead").map((item) => item._id)), ["head", "other"]);
});

function service(api, token = "token") {
  return module("../services/organization.service.ts", {
    "@/lib/api": { __esModule: true, default: api },
    "@/lib/auth": { getToken: () => token },
    "@/lib/organization-response": {},
    "@/lib/organization-hierarchy-response": response,
  });
}

test("hierarchy fetch retains the complete graph and maps the backend response", async () => {
  const signal = new AbortController().signal;
  const client = service({ get: async (path, config) => {
    assert.equal(path, "/organization/hierarchy");
    assert.equal(config.headers.Authorization, "Bearer token");
    assert.equal(config.signal, signal);
    assert.equal("params" in config, false);
    return { data: { organizationId: "company", employees: [raw], rootEmployeeIds: [], total: 1 } };
  } });
  const result = await client.getHierarchy(signal);
  assert.equal(result[0].fullName, "Alex Example");
  assert.equal(result[0].reportingManagerId, "lead");
});

test("manager assignment uses the canonical manager path and only managerId", async () => {
  const calls = [];
  const client = service({ patch: async (path, body) => calls.push([path, plain(body)]) });
  await client.updateReportingManager("person/id", "manager-id");
  await client.updateReportingManager("person/id", null);
  assert.deepEqual(calls, [["/employees/person%2Fid/manager", { managerId: "manager-id" }], ["/employees/person%2Fid/manager", { managerId: null }]]);
});

test("assignment conflicts propagate without retry and missing sessions block requests", async () => {
  const conflict = { response: { status: 409 } };
  let attempts = 0;
  const client = service({ patch: async () => { attempts++; throw conflict; } });
  await assert.rejects(client.updateReportingManager("person", "manager"), (error) => error === conflict);
  assert.equal(attempts, 1);
  await assert.rejects(service({}, null).getHierarchy(), /session has expired/);
});

const ui = {
  secondaryClass: "button", buttonClass: "button", inputClass: "input",
  Field: ({ label, children }) => React.createElement("label", null, label, children),
};
const link = { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) };
const { default: ReportingViews } = module("../components/organization/reporting-views.tsx", {
  "react/jsx-runtime": jsx, "next/link": link, "./ui": ui,
  "./view-controls": { viewCellClass: "cell", viewHeadClass: "head", viewTableClass: "table" },
});

test("reporting table renders real manager department and team relationships", () => {
  const rows = graph.visibleHierarchyRows(employees, { search: "member", department: "", team: "" });
  const html = renderToStaticMarkup(React.createElement(ReportingViews, { rows, employees, mode: "table", disabled: false, onEdit: () => {} }));
  assert.match(html, /Manager context/);
  assert.match(html, /\/hr\/organization\/departments\/engineering/);
  assert.match(html, /\/hr\/organization\/teams\/frontend/);
  assert.match(html, /EMP-003/);
  assert.match(html, /Change manager for member/);
  assert.match(html, /Direct reports/);
});

const { default: ReportingManagerEditor } = module("../components/organization/reporting-manager-editor.tsx", {
  react: React, "react/jsx-runtime": jsx, "@/lib/organization-hierarchy": graph,
  "@/lib/api": {}, "@/services/organization.service": {}, "./ui": ui,
});

test("rendered manager picker excludes the employee and their descendants", () => {
  const html = renderToStaticMarkup(React.createElement(ReportingManagerEditor, { employee: employees[1], employees, onSaved: () => {}, onCancel: () => {} }));
  assert.match(html, /<option value="head"/);
  assert.match(html, /<option value="other"/);
  assert.doesNotMatch(html, /<option value="lead"|<option value="member"/);
  assert.match(html, /No manager \(top level\)/);
});
