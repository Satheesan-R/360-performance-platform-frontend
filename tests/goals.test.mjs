import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/goals.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { keyResultProgress, objectiveProgress, validateObjective, isObjective } = context.exports;
const result = (patch = {}) => ({ id: "kr", title: "Reduce response time", unit: "hours", baseline: 8, target: 4, current: 6, ...patch });
const objective = (patch = {}) => ({ id: "goal", title: "Improve support", description: "", scope: "team", owner: "Owner", startDate: "2026-01-01", endDate: "2026-12-31", status: "active", keyResults: [result()], updatedAt: "2026-01-01T00:00:00Z", ...patch });

test("progress handles decreasing and increasing targets and clamps overshoot", () => {
  assert.equal(keyResultProgress(result()), 50);
  assert.equal(keyResultProgress(result({ baseline: 20, target: 80, current: 35 })), 25);
  assert.equal(keyResultProgress(result({ current: 2 })), 100);
  assert.equal(keyResultProgress(result({ current: 10 })), 0);
  assert.equal(keyResultProgress(result({ target: 8 })), 0);
  assert.equal(keyResultProgress(result({ current: Infinity })), 0);
});

test("objective progress averages key results equally", () => {
  assert.equal(objectiveProgress(objective({ keyResults: [result(), result({ current: 4 })] })), 75);
  assert.equal(objectiveProgress(objective({ keyResults: [] })), 0);
});

test("dates, ownership and measurable targets are required", () => {
  assert.equal(validateObjective(objective()), null);
  for (const patch of [{ owner: " " }, { title: " " }, { startDate: "2026-02-30" }, { endDate: "2025-01-01" }, { keyResults: [] }, { keyResults: [result({ target: 8 })] }, { keyResults: [result({ current: NaN })] }, { keyResults: [result({ unit: "" })] }]) {
    assert.equal(typeof validateObjective(objective(patch)), "string");
  }
});

test("completion requires every key result to reach its target", () => {
  assert.match(validateObjective(objective({ status: "completed" })), /reach their targets/);
  assert.equal(validateObjective(objective({ status: "completed", keyResults: [result({ current: 4 })] })), null);
  assert.match(validateObjective(objective({ status: "completed", keyResults: [result({ baseline: 0, target: 100, current: 99.9 })] })), /reach their targets/);
});

test("malformed stored drafts are rejected", () => {
  assert.equal(isObjective(objective()), true);
  for (const value of [null, {}, objective({ scope: "unknown" }), objective({ keyResults: [null] }), objective({ keyResults: [result({ current: "6" })] }), objective({ status: "completed" })]) assert.equal(isObjective(value), false);
});
