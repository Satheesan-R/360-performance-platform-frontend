import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Compile the actual dependency-free helper, so tests exercise the shipped logic.
const source = fs.readFileSync(new URL("../lib/organization-hierarchy.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { hierarchyRows, unavailableManagers } = context.exports;
const employee = (id, manager = null) => ({ _id: id, fullName: id, reportingManagerId: manager });

test("manager selection excludes the employee and every descendant", () => {
  const employees = [employee("head"), employee("lead", "head"), employee("report", "lead"), employee("peer", "head")];
  const blocked = unavailableManagers(employees, "lead");
  assert.equal(blocked.has("lead"), true);
  assert.equal(blocked.has("report"), true);
  assert.equal(blocked.has("head"), false);
  assert.equal(blocked.has("peer"), false);
});

test("existing cycles terminate and block every member in the chain", () => {
  const employees = [employee("a", "b"), employee("b", "a")];
  assert.equal(unavailableManagers(employees, "a").size, 2);
  const rows = hierarchyRows(employees);
  assert.equal(rows.length, 2);
  assert.equal(rows.every((row) => row.disconnected), true);
});

test("hierarchy handles multiple roots, missing managers and unsorted input", () => {
  const employees = [employee("child", "root"), employee("orphan", "missing"), employee("other"), employee("root")];
  const rows = hierarchyRows(employees);
  assert.equal(rows.length, employees.length);
  assert.equal(rows.find((row) => row.employee._id === "child").depth, 1);
  assert.equal(rows.find((row) => row.employee._id === "orphan").disconnected, true);
  assert.equal(rows.find((row) => row.employee._id === "other").depth, 0);
  assert.equal(rows.find((row) => row.employee._id === "root").disconnected, false);
});

test("empty organizations render no hierarchy rows", () => {
  assert.equal(hierarchyRows([]).length, 0);
});
