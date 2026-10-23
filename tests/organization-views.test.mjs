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
const labels = module("../lib/organization-views.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
function service(api, token = "test-token") {
  return module("../services/organization-views.service.ts", { "@/lib/api": { __esModule: true, default: api }, "@/lib/auth": { getToken: () => token } });
}

test("handles raw and populated relationship references without displaying object strings", () => {
  assert.equal(labels.referenceId("id"), "id");
  assert.equal(labels.referenceId({ _id: "id", name: "Engineering" }), "id");
  assert.equal(labels.referenceId(null), "");
  assert.equal(labels.referenceLabel({ _id: "id", name: "Engineering" }), "Engineering");
  assert.equal(labels.personLabel({ _id: "person", firstName: "Kamal", lastName: "Example" }), "Kamal Example");
  assert.equal(labels.personLabel(null), "Unassigned");
  assert.equal(labels.personLabel("missing-person"), "Employee unavailable");
});

test("department list uses authenticated search status and pagination", async () => {
  const signal = new AbortController().signal;
  const body = { departments: [{ headEmployeeId: { _id: "person", firstName: "Head" }, teamCount: 2, employeeCount: 5 }], pagination: { page: 2, totalPages: 3 } };
  const client = service({ get: async (path, config) => {
    assert.equal(path, "/departments");
    assert.equal(config.headers.Authorization, "Bearer test-token");
    assert.equal(config.signal, signal);
    assert.equal(config.params.page, 2);
    assert.equal(config.params.limit, 20);
    assert.equal(config.params.search, "Engineering");
    assert.equal(config.params.status, "active");
    return { data: body };
  } });
  assert.equal(await client.getDepartments({ search: "Engineering", status: "active", page: 2 }, signal), body);
});

test("department summary stays independent of table filters", async () => {
  const summary = { total: 4, active: 3, inactive: 1 };
  const client = service({ get: async (path, config) => {
    assert.equal(path, "/departments/summary");
    assert.equal("params" in config, false);
    return { data: { summary } };
  } });
  assert.equal(await client.getDepartmentSummary(), summary);
});

test("detail endpoints unwrap canonical populated department and team objects", async () => {
  const department = { headEmployeeId: { _id: "head" }, teamCount: 2 };
  const team = { departmentId: { _id: "department", name: "Engineering", status: "active" }, teamLeadEmployeeId: { _id: "lead" }, employeeCount: 3 };
  const client = service({ get: async (path) => {
    if (path === "/departments/dept%2Fid") return { data: { department } };
    assert.equal(path, "/teams/team%2Fid");
    return { data: { team } };
  } });
  assert.equal(await client.getDepartment("dept/id"), department);
  assert.equal(await client.getTeam("team/id"), team);
});

test("team lists scope to the chosen department or the global teams endpoint", async () => {
  const calls = [];
  const client = service({ get: async (path, config) => { calls.push(path); assert.equal(config.params.status, undefined); return { data: { teams: [], pagination: {} } }; } });
  await client.getTeams({ status: "" });
  await client.getTeams({}, "department/id");
  assert.deepEqual(calls, ["/teams", "/departments/department%2Fid/teams"]);
});

test("employee directories paginate both department and team endpoints", async () => {
  const calls = [];
  const employees = [{ _id: "person", workEmail: "person@example.com", user: { role: "employee", status: "disabled" } }];
  const client = service({ get: async (path, config) => {
    calls.push(path);
    assert.equal(config.params.search, "EMP-001");
    assert.equal(config.params.page, 3);
    return { data: { employees, pagination: { page: 3 } } };
  } });
  for (const kind of ["departments", "teams"]) assert.equal((await client.getDirectory(kind, "id", { search: "EMP-001", page: 3 })).employees, employees);
  assert.deepEqual(calls, ["/departments/id/employees", "/teams/id/employees"]);
});

test("department selectors follow every page of results", async () => {
  const pages = [];
  const client = service({ get: async (_, config) => {
    pages.push(config.params.page);
    assert.equal(config.params.limit, 100);
    return { data: { departments: [{ _id: `dept-${config.params.page}` }], pagination: { totalPages: 2 } } };
  } });
  assert.deepEqual(plain(await client.getDepartmentOptions()), [{ _id: "dept-1" }, { _id: "dept-2" }]);
  assert.deepEqual(pages, [1, 2]);
});

test("department and team writes send canonical head and lead fields including null clearing", async () => {
  const calls = [];
  const department = { name: "Engineering", headEmployeeId: null };
  const team = { name: "Frontend", departmentId: "department", teamLeadEmployeeId: "person" };
  const client = service({ post: async (path, body) => calls.push(["POST", path, body]), patch: async (path, body) => calls.push(["PATCH", path, body]) });
  await client.saveOrganizationStructure("departments", department);
  await client.saveOrganizationStructure("teams", team, "team/id");
  assert.equal(calls[0][2], department);
  assert.equal("departmentHeadId" in calls[0][2], false);
  assert.equal(calls[1][1], "/teams/team%2Fid");
  assert.equal(calls[1][2], team);
  assert.equal("teamLeadId" in calls[1][2], false);
});

test("deactivation calls the preserving DELETE endpoint rather than deleting employee relationships", async () => {
  const paths = [];
  const client = service({ delete: async (path) => paths.push(path) });
  await client.deactivateDepartment("department/id");
  assert.deepEqual(paths, ["/departments/department%2Fid"]);
});

test("membership assignment and removal only send teamId without changing the department or manager", async () => {
  const calls = [];
  const client = service({ patch: async (path, body) => calls.push([path, plain(body)]) });
  await client.assignEmployeeTeam("person/id", "team-id");
  await client.assignEmployeeTeam("person/id", null);
  assert.deepEqual(calls, [["/employees/person%2Fid/team", { teamId: "team-id" }], ["/employees/person%2Fid/team", { teamId: null }]]);
});

test("department assignment delegates incompatible team cleanup to the backend", async () => {
  const calls = [];
  const client = service({ patch: async (path, body) => calls.push([path, plain(body)]) });
  await client.assignEmployeeDepartment("person", "new-department");
  await client.assignEmployeeDepartment("person", null);
  assert.deepEqual(calls, [["/employees/person/department", { departmentId: "new-department" }], ["/employees/person/department", { departmentId: null }]]);
});

test("assignment conflicts propagate once without automatic mutation retries", async () => {
  const conflict = { response: { status: 409, data: { message: "Remove team members first" } } };
  let attempts = 0;
  const client = service({ patch: async () => { attempts++; throw conflict; } });
  await assert.rejects(client.assignEmployeeTeam("person", "team"), (error) => error === conflict);
  assert.equal(attempts, 1);
});

test("unauthenticated reads and assignments do not contact the backend", async () => {
  const client = service({ get: () => assert.fail("Must not call API"), patch: () => assert.fail("Must not call API") }, null);
  await assert.rejects(client.getDepartment("id"), /session has expired/);
  await assert.rejects(client.assignEmployeeTeam("person", "team"), /session has expired/);
});

const tree = {
  department: { name: "Engineering", headEmployeeId: null },
  teams: [{ _id: "empty", name: "Inactive empty team", status: "inactive", teamLeadEmployeeId: null, employeeCount: 0, employees: [] }, { _id: "active", name: "Frontend", status: "active", teamLeadEmployeeId: null, employeeCount: 1, employees: [{ _id: "one", firstName: "Unique Member", managerId: null }] }],
  unassignedEmployees: [{ _id: "stale", firstName: "Stale Employee", unassignedReason: "team-not-in-department", managerId: null }],
  summary: { teamCount: 2, employeeCount: 2, unassignedEmployeeCount: 1 },
};
const { default: DepartmentTree } = module("../components/organization/department-tree.tsx", {
  react: React, "react/jsx-runtime": jsx,
  "next/link": { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) },
  "@/hooks/use-organization-resource": { useOrganizationResource: () => ({ data: tree, loading: false, error: "", reload: () => {} }) },
  "@/lib/organization-views": labels,
  "@/services/organization-views.service": {},
  "./ui": { ResourceState: () => null, Status: ({ value }) => React.createElement("span", null, value) },
  "./view-controls": { ViewFilters: () => null },
});

test("hierarchy preserves inactive empty teams and employees with stale team references", () => {
  const html = renderToStaticMarkup(React.createElement(DepartmentTree, { id: "department" }));
  assert.match(html, /Inactive empty team/);
  assert.match(html, /No employees in this group/);
  assert.match(html, /Employees without a team/);
  assert.match(html, /Team reference is outside this department or unavailable/);
  assert.equal((html.match(/Unique Member/g) || []).length, 1);
  assert.equal((html.match(/Stale Employee/g) || []).length, 1);
  assert.match(html, /\/hr\/organization\/teams\/active/);
});

const { ViewPagination } = module("../components/organization/view-controls.tsx", { "react/jsx-runtime": jsx, "./ui": { secondaryClass: "button" } });
test("pagination disables both directions for an empty directory", () => {
  const html = renderToStaticMarkup(React.createElement(ViewPagination, { pagination: { page: 1, total: 0, totalPages: 0, limit: 20 }, onPage: () => {} }));
  assert.match(html, /Page 1 of 1/);
  assert.equal((html.match(/disabled=""/g) || []).length, 2);
});
