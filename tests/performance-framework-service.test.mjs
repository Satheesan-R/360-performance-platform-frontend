import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../services/performance-framework.service.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;

function service(api, token = "test-token") {
  const context = { exports: {}, require: (name) => {
    if (name === "@/lib/api") return { __esModule: true, default: api };
    if (name === "@/lib/auth") return { getToken: () => token };
    throw new Error(`Unexpected import: ${name}`);
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test("lists frameworks with authenticated server-side filters and pagination", async () => {
  const signal = new AbortController().signal;
  const body = { frameworks: [], pagination: { page: 2, totalPages: 3 } };
  const client = service({ get: async (path, config) => {
    assert.equal(path, "/performance-frameworks");
    assert.equal(config.headers.Authorization, "Bearer test-token");
    assert.equal(config.signal, signal);
    assert.equal(config.params.page, 2);
    assert.equal(config.params.search, "Engineer");
    assert.equal(config.params.status, undefined);
    assert.equal(config.params.limit, 20);
    return { data: body };
  } });
  assert.equal(await client.getFrameworks({ search: "Engineer", status: "", page: 2 }, signal), body);
});

test("loads every page of active employment types for the form", async () => {
  const calls = [];
  const client = service({ get: async (path, config) => {
    calls.push(config.params.page);
    assert.equal(path, "/employment-types");
    assert.equal(config.params.status, "active");
    assert.equal(config.params.limit, 100);
    return { data: { employmentTypes: [{ _id: `type-${config.params.page}` }], pagination: { totalPages: 2 } } };
  } });
  const result = await client.getFrameworkEmploymentTypes();
  assert.deepEqual(calls, [1, 2]);
  assert.equal(result.length, 2);
  assert.equal(result[1]._id, "type-2");
});

test("creates and patches frameworks without adding server-owned fields", async () => {
  const values = { name: "Engineering", status: "draft", applicableEmploymentTypeIds: ["type-id"] };
  const framework = { _id: "framework-id", ...values };
  const calls = [];
  const client = service({
    post: async (path, payload) => { calls.push(["POST", path]); assert.equal(payload, values); return { data: { framework } }; },
    patch: async (path, payload) => { calls.push(["PATCH", path]); assert.equal(payload, values); return { data: { framework } }; },
  });
  assert.equal(await client.saveFramework(values), framework);
  assert.equal(await client.saveFramework(values, "framework-id"), framework);
  assert.deepEqual(calls, [["POST", "/performance-frameworks"], ["PATCH", "/performance-frameworks/framework-id"]]);
});

test("unwraps summary and blocks requests without a session", async () => {
  const summary = { total: 2, draft: 1, active: 1, archived: 0 };
  const client = service({ get: async () => ({ data: { summary } }) });
  assert.equal(await client.getFrameworkSummary(), summary);
  const unauthenticated = service({ get: () => assert.fail("Must not call the API") }, null);
  await assert.rejects(unauthenticated.getFrameworkSummary(), /session has expired/);
});
