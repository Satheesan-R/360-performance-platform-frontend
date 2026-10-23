import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function module(file, imports = {}) {
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  const context = { exports: {}, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

const { criterionInput } = module("../lib/framework-criteria.ts");
const draft = { name: "Problem Solving", description: "Technical decisions", weight: "30", status: "active", category: "technical", measurementUnit: "percentage", targetValue: "90", targetPeriod: "Quarter 1" };
const plain = (value) => JSON.parse(JSON.stringify(value));

test("competencies send numeric fractional weights and no KPI fields", () => {
  assert.deepEqual(plain(criterionInput("competencies", { ...draft, weight: "12.5" })), {
    name: draft.name, description: draft.description, weight: 12.5, status: "active", category: "technical",
  });
});

test("KPIs allow zero and negative numeric targets without competency fields", () => {
  for (const target of ["0", "-5", "90.5"]) {
    const result = criterionInput("kpis", { ...draft, targetValue: target });
    assert.equal(result.targetValue, Number(target));
    assert.equal(result.measurementUnit, "percentage");
    assert.equal("category" in result, false);
  }
});

test("blank numeric fields are rejected instead of becoming zero", () => {
  assert.throws(() => criterionInput("competencies", { ...draft, weight: " " }), /Weight must be a number/);
  assert.throws(() => criterionInput("kpis", { ...draft, targetValue: "" }), /Target value must be a number/);
  assert.equal(criterionInput("competencies", { ...draft, weight: "0" }).weight, 0);
});

test("rejects invalid or non-finite weights and targets", () => {
  for (const weight of ["-1", "101", "NaN", "Infinity"]) assert.throws(() => criterionInput("competencies", { ...draft, weight }));
  for (const targetValue of ["NaN", "Infinity"]) assert.throws(() => criterionInput("kpis", { ...draft, targetValue }));
});

test("enforces text limits and trims optional target periods", () => {
  for (const name of [" ", "x".repeat(201)]) assert.throws(() => criterionInput("competencies", { ...draft, name }));
  assert.throws(() => criterionInput("kpis", { ...draft, measurementUnit: " " }));
  assert.throws(() => criterionInput("kpis", { ...draft, targetPeriod: "x".repeat(201) }));
  assert.throws(() => criterionInput("competencies", { ...draft, description: "x".repeat(2001) }));
  assert.equal(criterionInput("kpis", { ...draft, targetPeriod: " " }).targetPeriod, "");
});

function service(api, { token = "test-token", getFrameworks = () => assert.fail("Unexpected framework request") } = {}) {
  return module("../services/framework-criteria.service.ts", {
    "@/lib/api": { __esModule: true, default: api },
    "@/lib/auth": { getToken: () => token },
    "./performance-framework.service": { getFrameworks },
  });
}

test("framework selector follows all pages instead of dropping later frameworks", async () => {
  const pages = [];
  const signal = new AbortController().signal;
  const client = service({}, { getFrameworks: async (params, requestSignal) => {
    pages.push(params.page);
    assert.equal(requestSignal, signal);
    return { frameworks: [{ _id: `framework-${params.page}` }], pagination: { totalPages: 2 } };
  } });
  assert.deepEqual(plain(await client.getCriteriaFrameworks(signal)), [{ _id: "framework-1" }, { _id: "framework-2" }]);
  assert.deepEqual(pages, [1, 2]);
});

test("loads either criterion type with session filters and server scoring", async () => {
  const scoring = { competencyCount: 2, kpiCount: 1, totalWeight: 100, weightsValid: true };
  const signal = new AbortController().signal;
  for (const kind of ["competencies", "kpis"]) {
    const items = [{ _id: "criterion-id" }];
    const client = service({ get: async (path, config) => {
      assert.equal(path, `/performance-frameworks/framework-id/${kind}`);
      assert.equal(config.headers.Authorization, "Bearer test-token");
      assert.equal(config.signal, signal);
      assert.equal(config.params.search, "SLA");
      assert.equal(config.params.status, "active");
      return { data: { [kind]: items, scoring } };
    } });
    const result = await client.getCriteria("framework-id", kind, { search: "SLA", status: "active" }, signal);
    assert.equal(result.items, items);
    assert.equal(result.scoring, scoring);
  }
});

test("invalid criteria responses fail instead of rendering an empty configuration", async () => {
  for (const data of [{}, { competencies: [] }, { scoring: {} }]) {
    const client = service({ get: async () => ({ data }) });
    await assert.rejects(client.getCriteria("id", "competencies", { search: "", status: "" }), /Unexpected criteria response/);
  }
});

test("create and edit use per-item endpoints with stable encoded IDs", async () => {
  const calls = [];
  const values = criterionInput("kpis", draft);
  const client = service({
    post: async (path, payload, config) => { calls.push(["POST", path]); assert.equal(payload, values); assert.equal(config.headers.Authorization, "Bearer test-token"); },
    patch: async (path, payload) => { calls.push(["PATCH", path]); assert.equal(payload, values); },
  });
  await client.saveCriterion("framework/id", "kpis", values);
  await client.saveCriterion("framework/id", "kpis", values, "criterion/id");
  assert.deepEqual(calls, [["POST", "/performance-frameworks/framework%2Fid/kpis"], ["PATCH", "/performance-frameworks/framework%2Fid/kpis/criterion%2Fid"]]);
});

test("deactivation patches only status and preserves the criterion record", async () => {
  const client = service({ patch: async (path, values) => {
    assert.equal(path, "/performance-frameworks/framework-id/competencies/criterion-id");
    assert.deepEqual(plain(values), { status: "inactive" });
  } });
  await client.setCriterionStatus("framework-id", "competencies", "criterion-id", "inactive");
});

test("conflict responses propagate without retrying a stale mutation", async () => {
  const conflict = { response: { status: 409, data: { message: "Framework changed while saving" } } };
  let attempts = 0;
  const client = service({ patch: async () => { attempts += 1; throw conflict; } });
  await assert.rejects(client.setCriterionStatus("framework-id", "kpis", "criterion-id", "inactive"), (error) => error === conflict);
  assert.equal(attempts, 1);
});

test("unauthenticated criteria requests never reach the backend", async () => {
  const client = service({ get: () => assert.fail("Must not call API") }, { token: null });
  await assert.rejects(client.getCriteriaFramework("id"), /session has expired/);
  await assert.rejects(client.getCriteria("id", "kpis", { search: "", status: "" }), /session has expired/);
});
