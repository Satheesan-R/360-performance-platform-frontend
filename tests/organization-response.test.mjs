import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/organization-response.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { parseOrganizationResponse } = context.exports;
const organization = { _id: "company-id", name: "Example Company", code: "EX", status: "active" };

test("accepts direct, data-wrapped and organization-wrapped responses", () => {
  for (const response of [organization, { data: organization }, { organization }, { data: { organization } }]) {
    const result = parseOrganizationResponse(response);
    assert.equal(result.name, organization.name);
    assert.equal(result._id, organization._id);
    assert.equal(result.code, organization.code);
    assert.equal(result.status, organization.status);
  }
});

test("missing optional details become strings suitable for controlled form fields", () => {
  const result = parseOrganizationResponse({ ...organization, description: null, contactEmail: 123 });
  assert.equal(result.description, "");
  assert.equal(result.contactEmail, "");
  assert.equal(result.logoUrl, "");
});

test("invalid and missing names produce an API error before rendering", () => {
  for (const response of [null, [], {}, { message: "Success" }, { organization: null }, { ...organization, name: undefined }, { ...organization, name: 123 }, { ...organization, name: "  " }]) {
    assert.throws(() => parseOrganizationResponse(response), /missing a valid name/);
  }
});

test("rejects invalid status instead of displaying it as inactive", () => {
  assert.throws(() => parseOrganizationResponse({ ...organization, status: "unknown" }), /invalid status/);
  assert.throws(() => parseOrganizationResponse({ ...organization, status: undefined }), /invalid status/);
});
