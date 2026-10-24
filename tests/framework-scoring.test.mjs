import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function module(file, imports = {}) {
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
  const context = { exports: {}, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const { scoringDraft, scoringInput, sampleRatings } = module("../lib/framework-scoring.ts");
const empty = { frameworkId: "id", version: 0, ratingScale: null, categoryWeights: null, reviewerWeights: null, enabledReviewers: [], validation: { ready: false, message: "Not configured" } };
const plain = (value) => JSON.parse(JSON.stringify(value));
test("legacy settings initialize team lead to zero without enabling it", () => {
  const result = scoringDraft(empty);
  assert.equal(result.reviewers.tech_lead, "0");
  assert.equal(result.enabledReviewers.includes("tech_lead"), false);
  assert.equal(scoringInput(draft()).reviewerWeights.tech_lead, 0);
});

test("team lead weights share the reviewer budget", () => {
  const values = {
    ...draft(),
    enabledReviewers: ["self", "peer", "manager", "tech_lead"],
    reviewers: { self: "10", peer: "20", manager: "40", tech_lead: "30" },
  };
  const result = scoringInput(values);
  assert.equal(result.reviewerWeights.tech_lead, 30);
  assert.throws(() => scoringInput({
    ...values,
    reviewers: { ...values.reviewers, tech_lead: "20" },
  }), /Reviewer weights must total/);
  assert.throws(() => scoringInput({
    ...values,
    enabledReviewers: ["self", "peer", "manager"],
  }), /disabled reviewers need/);
  assert.equal(Object.values(result.reviewerWeights).reduce((sum, value) => sum + value, 0), 100);
});
function draft() {
  return { editScale: true, editCategories: true, editReviewers: true, max: 5, labels: ["One", "Two", "Three", "Four", "Five"], categories: { technical: "60", behavioral: "40" }, reviewers: { self: "20", peer: "20", manager: "60" }, enabledReviewers: ["self", "peer", "manager"] };
}

test("missing settings stay unconfigured instead of receiving scoring defaults", () => {
  const result = scoringDraft(empty);
  assert.equal(result.max, "");
  assert.equal(result.editScale, false);
  assert.equal(result.editCategories, false);
  assert.equal(result.editReviewers, false);
  assert.equal(result.categories.technical, "");
  assert.ok(result.labels.every((label) => label === ""));
  assert.throws(() => scoringInput(result), /Select at least one section/);
});

test("supports each allowed scale with one trimmed label per integer", () => {
  for (const max of [3, 4, 5]) {
    const result = scoringInput({ ...draft(), max, labels: [" One ", "Two", "Three", "Four", "Five"] });
    assert.equal(result.ratingScale.min, 1);
    assert.equal(result.ratingScale.max, max);
    assert.equal(result.ratingScale.levels.length, max);
    assert.equal(result.ratingScale.levels[0].label, "One");
    assert.deepEqual(plain(result.ratingScale.levels.map((level) => level.value)), Array.from({ length: max }, (_, i) => i + 1));
  }
});

test("rejects unsupported ranges and missing or overly long labels", () => {
  for (const max of ["", 2, 6]) assert.throws(() => scoringInput({ ...draft(), max }), /Choose a/);
  for (const label of [" ", "x".repeat(201)]) assert.throws(() => scoringInput({ ...draft(), labels: [label, "Two", "Three", "Four", "Five"] }), /every rating level/);
});

test("validates category and reviewer budgets separately as JSON numbers", () => {
  const result = scoringInput(draft());
  assert.equal(result.categoryWeights.technical, 60);
  assert.equal(result.reviewerWeights.manager, 60);
  assert.equal(Object.values(result.categoryWeights).reduce((a, b) => a + b), 100);
  assert.equal(Object.values(result.reviewerWeights).reduce((a, b) => a + b), 100);
  assert.throws(() => scoringInput({ ...draft(), categories: { technical: "50", behavioral: "40" } }), /Category weights must total/);
  assert.throws(() => scoringInput({ ...draft(), reviewers: { self: "20", peer: "20", manager: "50" } }), /Reviewer weights must total/);
});

test("rejects blank non-finite and out-of-range weights while allowing fractional totals", () => {
  for (const technical of ["", " ", "NaN", "Infinity", "-1", "101"]) assert.throws(() => scoringInput({ ...draft(), categories: { technical, behavioral: "40" } }));
  assert.equal(scoringInput({ ...draft(), categories: { technical: "33.3333333", behavioral: "66.6666667" } }).categoryWeights.technical, 33.3333333);
});

test("disabled reviewers need zero while enabled reviewers need positive weight", () => {
  assert.throws(() => scoringInput({ ...draft(), enabledReviewers: ["self", "manager"] }), /Disabled reviewers need|disabled reviewers need/);
  const result = scoringInput({ ...draft(), enabledReviewers: ["self", "manager"], reviewers: { self: "20", peer: "0", manager: "80" } });
  assert.equal(result.reviewerWeights.peer, 0);
  assert.deepEqual(plain(result.enabledReviewers), ["self", "manager"]);
  assert.throws(() => scoringInput({ ...draft(), reviewers: { self: "0", peer: "20", manager: "80" } }), /positive weights/);
  assert.throws(() => scoringInput({ ...draft(), enabledReviewers: [] }), /Enable at least one/);
  assert.throws(() => scoringInput({ ...draft(), enabledReviewers: ["self", "self"] }), /Enable at least one/);
});

test("unselected blocks are omitted and reviewer settings travel together", () => {
  const result = scoringInput({ ...draft(), editScale: false, editCategories: false });
  assert.deepEqual(Object.keys(result).sort(), ["enabledReviewers", "reviewerWeights"]);
  assert.equal("ratingScale" in result, false);
});

const preview = { ratingScale: { min: 1, max: 5 }, enabledReviewers: ["self", "manager"], criteria: [{ criterionId: "positive", name: "Delivery", effectiveWeight: 100 }, { criterionId: "zero", name: "Other", effectiveWeight: 0 }] };

test("sample ratings include only enabled reviewers and positive-weight criteria", () => {
  const result = sampleRatings(preview, { self: { positive: "1", zero: "4" }, manager: { positive: "5" }, peer: { positive: "3" } });
  assert.deepEqual(plain(result), { self: { positive: 1 }, manager: { positive: 5 } });
});

test("samples reject missing fractional and out-of-scale ratings", () => {
  for (const value of ["", "0", "6", "2.5", "Infinity"]) assert.throws(() => sampleRatings(preview, { self: { positive: value }, manager: { positive: "5" } }), /Choose a rating/);
  assert.throws(() => sampleRatings(preview, { self: { positive: "3" } }), /manager/);
});

function service(api, token = "token") {
  return module("../services/framework-scoring.service.ts", { "@/lib/api": { __esModule: true, default: api }, "@/lib/auth": { getToken: () => token } });
}

test("loads scoring with encoded framework identity and authenticated abortable requests", async () => {
  const signal = new AbortController().signal;
  const client = service({ get: async (path, config) => {
    assert.equal(path, "/performance-frameworks/framework%2Fid/scoring");
    assert.equal(config.headers.Authorization, "Bearer token");
    assert.equal(config.signal, signal);
    return { data: { scoring: empty } };
  } });
  assert.equal(await client.getFrameworkScoring("framework/id", signal), empty);
});

test("partial saves contain only selected configuration blocks", async () => {
  const values = { categoryWeights: { technical: 100, behavioral: 0 } };
  const client = service({ patch: async (path, body, config) => {
    assert.equal(path, "/performance-frameworks/id/scoring");
    assert.equal(body, values);
    assert.equal(config.headers.Authorization, "Bearer token");
    return { data: { scoring: empty } };
  } });
  assert.equal(await client.saveFrameworkScoring("id", values), empty);
});

test("saved and proposed previews use the read-only preview endpoint", async () => {
  const requests = [{}, { configuration: { categoryWeights: { technical: 60, behavioral: 40 } } }, { reviewerRatings: { self: { id: 3 } } }];
  let calls = 0;
  const client = service({ post: async (path, body) => {
    assert.equal(path, "/performance-frameworks/id/scoring/preview");
    assert.equal(body, requests[calls++]);
    return { data: { preview } };
  } });
  for (const request of requests) assert.equal(await client.previewFrameworkScoring("id", request), preview);
  assert.equal(calls, 3);
});

test("save conflicts propagate once and unauthenticated calls never reach API", async () => {
  const conflict = { response: { status: 409 } };
  let calls = 0;
  const client = service({ patch: async () => { calls++; throw conflict; } });
  await assert.rejects(client.saveFrameworkScoring("id", {}), (error) => error === conflict);
  assert.equal(calls, 1);
  const missing = service({ get: () => assert.fail("Must not call API") }, null);
  await assert.rejects(missing.getFrameworkScoring("id"), /session has expired/);
});
