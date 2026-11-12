import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const compiled = ts.transpileModule(fs.readFileSync(new URL("../services/review-cycle.service.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function service(api, token = "token") {
  const context = { exports: {}, require: name => name === "@/lib/api" ? { default: api } : { getToken: () => token } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
test("draft edits send the loaded version and never retry conflicts", async () => {
  let calls = 0;
  const conflict = new Error("conflict");
  const client = service({ patch: async (path, body, config) => {
    calls++;
    assert.equal(path, "/review-cycles/cycle");
    assert.equal(body.version, 7);
    assert.equal(body.name, "Annual");
    assert.equal(body.__v, undefined);
    assert.equal(body.status, undefined);
    assert.equal(config.headers.Authorization, "Bearer token");
    throw conflict;
  } });
  await assert.rejects(client.saveReviewCycle({ name: "Annual" }, { _id: "cycle", __v: 7 }), e => e === conflict);
  assert.equal(calls, 1);
});
test("create unwraps the saved draft without adding publication fields", async () => {
  const cycle = { _id: "saved", __v: 0 };
  const input = { name: "Annual", employeeIds: ["employee"] };
  const client = service({ post: async (path, body) => {
    assert.equal(path, "/review-cycles"); assert.equal(body, input);
    return { data: { cycle } };
  } });
  assert.equal(await client.saveReviewCycle(input), cycle);
});
test("missing session blocks cycle requests", async () => {
  const client = service({ get: () => assert.fail("must not request") }, null);
  await assert.rejects(client.getReviewCycle("cycle"), /session has expired/);
});
