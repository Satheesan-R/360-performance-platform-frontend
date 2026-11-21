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
  const context = { exports: {}, TextEncoder, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const { templateDraft, templateInput, templatePatch, newTemplateSection } = module("../lib/review-template.ts");
const ids = { template: "a".repeat(24), framework: "b".repeat(24), section: "c".repeat(24), question: "d".repeat(24), competency: "e".repeat(24), type: "f".repeat(24) };
const plain = (value) => JSON.parse(JSON.stringify(value));
function original() {
  return { _id: ids.template, __v: 2, name: "Annual Review", description: "Annual review questions", frameworkId: ids.framework, employmentTypeIds: [ids.type], status: "draft", evidenceRequired: false, frameworkVersion: null, frameworkSnapshot: null, sections: [{ _id: ids.section, title: "Skills", competencyIds: [ids.competency], kpiIds: [], required: true, allowComments: true, commentsRequired: false, evidenceRequired: false, questions: [{ _id: ids.question, prompt: "What did you achieve?", required: true }] }] };
}
function createDraft() {
  return { ...templateDraft(), name: " New template ", frameworkId: ids.framework, sections: [{ ...newTemplateSection("local-section"), title: " Skills ", questions: [{ key: "local-question", prompt: " Achievements? ", required: true }] }] };
}

test("HR targeting defaults and write fields follow the template API", () => {
  const values = templateInput({ ...createDraft(), departmentIds: [ids.type] });
  assert.equal(values.reviewType, "annual");
  assert.equal(values.targetRole, "department_manager");
  assert.deepEqual(plain(values.departmentIds), [ids.type]);
  assert.throws(() => templateInput({ ...createDraft(), reviewType: "monthly" }), /Choose annual/);
  assert.throws(() => templateInput({ ...createDraft(), targetRole: "tech_lead" }), /Department Managers only/);
  assert.throws(() => templateInput({ ...createDraft(), departmentIds: [ids.type, ids.type] }), /unique references/);
});

test("legacy and unchanged targeting are omitted from metadata edits", () => {
  const legacy = original();
  const patch = templatePatch({ ...templateDraft(legacy), name: "Renamed" }, legacy);
  for (const field of ["reviewType", "targetRole", "departmentIds"]) assert.equal(field in patch, false);
  const configured = { ...legacy, reviewType: "probation", targetRole: "department_manager", departmentIds: [ids.type] };
  const changed = templatePatch({ ...templateDraft(configured), reviewType: "internship", departmentIds: [] }, configured);
  assert.equal(changed.reviewType, "internship");
  assert.deepEqual(plain(changed.departmentIds), []);
  assert.equal("targetRole" in changed, false);
});

test("new template defaults match draft comments and evidence policies", () => {
  const draft = templateDraft();
  assert.equal(draft.status, "draft");
  assert.equal(draft.evidenceRequired, false);
  assert.equal(draft.sections.length, 0);
  const section = newTemplateSection("local");
  assert.equal(section.allowComments, true);
  assert.equal(section.required, false);
  assert.equal(section.commentsRequired, false);
});

test("create serializes only writable fields and removes local identities", () => {
  const values = templateInput({ ...createDraft(), organizationId: "must-not-send", frameworkSnapshot: {} });
  assert.equal(values.name, "New template");
  assert.equal(values.sections[0].title, "Skills");
  assert.equal(values.sections[0].questions[0].prompt, "Achievements?");
  assert.equal("key" in values.sections[0], false);
  assert.equal("key" in values.sections[0].questions[0], false);
  assert.equal("_id" in values.sections[0], false);
  assert.equal("organizationId" in values, false);
  assert.equal("frameworkSnapshot" in values, false);
});

test("edits retain section and question IDs without mutating the original", () => {
  const template = original();
  const draft = templateDraft(template);
  draft.sections[0] = { ...draft.sections[0], title: "New title" };
  const values = templateInput(draft, template);
  assert.equal(values.sections[0]._id, ids.section);
  assert.equal(values.sections[0].questions[0]._id, ids.question);
  assert.equal(template.sections[0].title, "Skills");
});

test("rejects injected or transferred nested IDs including IDs on create", () => {
  const template = original();
  assert.throws(() => templateInput(templateDraft(template)), /Section IDs/);
  const draft = templateDraft(template);
  draft.sections[0].questions[0]._id = "1".repeat(24);
  assert.throws(() => templateInput(draft, template), /Question IDs/);
  const injected = templateDraft(template);
  injected.sections[0]._id = "2".repeat(24);
  assert.throws(() => templateInput(injected, template), /Section IDs/);
});

test("a criterion cannot be repeated within or across sections", () => {
  const draft = createDraft();
  draft.sections[0].competencyIds = [ids.competency, ids.competency];
  assert.throws(() => templateInput(draft), /unique references/);
  draft.sections[0].competencyIds = [ids.competency];
  draft.sections.push({ ...newTemplateSection("other"), title: "Other", competencyIds: [ids.competency] });
  assert.throws(() => templateInput(draft), /only one section/);
});

test("enforces section question and text limits", () => {
  const draft = createDraft();
  assert.throws(() => templateInput({ ...draft, name: " " }), /Template name/);
  assert.throws(() => templateInput({ ...draft, description: "x".repeat(2001) }), /Description/);
  assert.throws(() => templateInput({ ...draft, sections: Array(51).fill(draft.sections[0]) }), /50 sections/);
  const section = { ...draft.sections[0], questions: Array.from({ length: 21 }, (_, i) => ({ key: String(i), prompt: "Question", required: false })) };
  assert.throws(() => templateInput({ ...draft, sections: [section] }), /20 questions/);
  const twenty = { ...section, questions: section.questions.slice(0, 20) };
  assert.throws(() => templateInput({ ...draft, sections: Array(11).fill(twenty) }), /200 questions/);
});

test("required comments and question prompts are validated even in drafts", () => {
  const draft = createDraft();
  draft.sections[0].allowComments = false;
  draft.sections[0].commentsRequired = true;
  assert.throws(() => templateInput(draft), /Enable comments/);
  draft.sections[0].commentsRequired = false;
  draft.sections[0].questions[0].prompt = " ";
  assert.throws(() => templateInput(draft), /Question prompt/);
});

test("preserves unchanged employment targeting on metadata edits", () => {
  const template = original();
  const draft = templateDraft(template);
  draft.name = "Renamed";
  assert.equal("employmentTypeIds" in templatePatch(draft, template), false);
  draft.employmentTypeIds = [];
  assert.deepEqual(plain(templatePatch(draft, template).employmentTypeIds), []);
});

test("checks UTF-8 bytes against the server request size limit", () => {
  const draft = createDraft();
  draft.sections[0].questions = Array.from({ length: 5 }, (_, i) => ({ key: String(i), prompt: "界".repeat(2000), required: false }));
  assert.throws(() => templateInput(draft), /20 KB request limit/);
});

function service(api, token = "test-token") {
  return module("../services/review-template.service.ts", { "@/lib/api": { __esModule: true, default: api }, "@/lib/auth": { getToken: () => token } });
}

test("list sends server pagination search and filters with Bearer auth", async () => {
  const signal = new AbortController().signal;
  const body = { templates: [], pagination: { page: 2, totalPages: 3 } };
  const client = service({ get: async (path, config) => {
    assert.equal(path, "/review-templates");
    assert.equal(config.headers.Authorization, "Bearer test-token");
    assert.equal(config.signal, signal);
    assert.equal(config.params.page, 2);
    assert.equal(config.params.limit, 20);
    assert.equal(config.params.search, "Annual");
    assert.equal(config.params.status, undefined);
    assert.equal(config.params.frameworkId, undefined);
    return { data: body };
  } });
  assert.equal(await client.getReviewTemplates({ search: "Annual", status: "", frameworkId: "", page: 2 }, signal), body);
});

test("detail loads raw references and create/edit forward only the supplied body", async () => {
  const template = original(), values = { name: "Renamed" };
  const calls = [];
  const client = service({
    get: async (path) => { calls.push(["GET", path]); return { data: { template } }; },
    post: async (path, body) => { calls.push(["POST", path]); assert.equal(body, values); return { data: { template } }; },
    patch: async (path, body) => { calls.push(["PATCH", path]); assert.equal(body, values); return { data: { template } }; },
  });
  assert.equal(await client.getReviewTemplate("template/id"), template);
  assert.equal(await client.saveReviewTemplate(values), template);
  assert.equal(await client.saveReviewTemplate(values, "template/id"), template);
  assert.deepEqual(calls, [["GET", "/review-templates/template%2Fid"], ["POST", "/review-templates"], ["PATCH", "/review-templates/template%2Fid"]]);
});

test("saved and proposed previews use separate read-only requests", async () => {
  const values = { name: "Proposed name" }, preview = { usesFrozenFramework: true };
  const calls = [];
  const client = service({
    get: async (path) => { calls.push(["GET", path]); return { data: { preview } }; },
    post: async (path, body) => { calls.push(["POST", path]); assert.equal(body, values); return { data: { preview } }; },
  });
  assert.equal(await client.getTemplatePreview("id"), preview);
  assert.equal(await client.previewTemplateChanges("id", values), preview);
  assert.deepEqual(calls, [["GET", "/review-templates/id/preview"], ["POST", "/review-templates/id/preview"]]);
});

test("snapshot creation never supplies overrides and historic reads use snapshot IDs", async () => {
  const snapshot = { _id: "snapshot-id", sourceVersion: 2 };
  const client = service({
    post: async (path, body) => { assert.equal(path, "/review-templates/id/snapshots"); assert.deepEqual(plain(body), {}); return { data: { snapshot } }; },
    get: async (path) => { assert.equal(path, "/review-templates/id/snapshots/snapshot%2Fid"); return { data: { snapshot } }; },
  });
  assert.equal(await client.createTemplateSnapshot("id"), snapshot);
  assert.equal(await client.getTemplateSnapshot("id", "snapshot/id"), snapshot);
});

test("archive sends a status-only patch and conflicts do not trigger retries", async () => {
  const conflict = { response: { status: 409 } };
  let attempts = 0;
  const client = service({ patch: async (_, body) => { attempts++; assert.deepEqual(plain(body), { status: "archived" }); throw conflict; } });
  await assert.rejects(client.saveReviewTemplate({ status: "archived" }, "id"), (error) => error === conflict);
  assert.equal(attempts, 1);
});

test("missing sessions block reads and writes before contacting the backend", async () => {
  const client = service({ get: () => assert.fail("Must not call API"), post: () => assert.fail("Must not call API") }, null);
  await assert.rejects(client.getReviewTemplate("id"), /session has expired/);
  await assert.rejects(client.createTemplateSnapshot("id"), /session has expired/);
});

const reviewForm = module("../components/performance-framework/review-form-preview.tsx", {
  react: React, "react/jsx-runtime": jsx,
});
const { TemplatePreviewContent } = module("../components/performance-framework/template-preview.tsx", {
  react: React, "react/jsx-runtime": jsx, "./review-form-preview": reviewForm, "@/hooks/use-organization-resource": {}, "@/lib/api": {}, "@/services/review-template.service": {}, "@/components/organization/ui": {},
});

test("renders pinned preview labels and missing criteria without silently dropping them", () => {
  const preview = { name: "Pinned review", description: "", status: "active", frameworkName: "Original framework name", frameworkVersion: 3, usesFrozenFramework: true, employmentTypeIds: [], effectiveEmploymentTypeIds: [], ratingScale: null, validation: { ready: false, message: "Criterion missing" }, criteriaWeights: [], sections: [{ ...original().sections[0], competencies: [{ _id: ids.competency, missing: true }], kpis: [] }] };
  const html = renderToStaticMarkup(React.createElement(TemplatePreviewContent, { preview }));
  assert.match(html, /Original framework name/);
  assert.match(html, /Pinned configuration/);
  assert.match(html, /Missing competency/);
  assert.match(html, /What did you achieve/);
  assert.match(html, /Criterion missing/);
});

test("preview renders fillable required comments questions and evidence without submission", () => {
  const section = { ...original().sections[0], commentsRequired: true, evidenceRequired: true, competencies: [], kpis: [] };
  const preview = { name: "Review", description: "", frameworkName: "Framework", frameworkVersion: 1, usesFrozenFramework: false, employmentTypeIds: [], effectiveEmploymentTypeIds: [], ratingScale: null, validation: { ready: true, message: null }, criteriaWeights: [], sections: [section] };
  const html = renderToStaticMarkup(React.createElement(TemplatePreviewContent, { preview }));
  assert.match(html, /Evidence required/);
  assert.match(html, /Comments field/);
  assert.match(html, /Answer required/);
  assert.match(html, /<textarea[^>]*required/);
  assert.match(html, /type="file"[^>]*required/);
  assert.match(html, /Check preview form/);
  assert.match(html, /Selected files are not uploaded/);
  assert.doesNotMatch(html, /Submit Review/);
});

test("preview shows HR review targeting and legacy configuration stays unconfigured", () => {
  const preview = {
    name: "HR review", description: "", frameworkName: "Framework", frameworkVersion: 1,
    usesFrozenFramework: false, employmentTypeIds: [], effectiveEmploymentTypeIds: [],
    ratingScale: null, validation: { ready: false, message: null }, criteriaWeights: [], sections: [],
    reviewType: "internship", targetRole: "department_manager", departmentIds: [ids.type],
  };
  const html = renderToStaticMarkup(React.createElement(TemplatePreviewContent, { preview }));
  assert.match(html, /internship/);
  assert.match(html, /Department Manager/);
  assert.match(html, new RegExp(ids.type));
  const legacy = renderToStaticMarkup(React.createElement(TemplatePreviewContent, {
    preview: { ...preview, reviewType: null, targetRole: null, departmentIds: [] },
  }));
  assert.match(legacy, /Not configured/);
  assert.match(legacy, /No department restriction/);
});

test("review form uses configured scale labels and separates competency categories from KPI results", () => {
  const section = {
    ...original().sections[0],
    competencies: [
      { _id: ids.competency, name: "Debugging", category: "technical", description: "Find defects", weight: 30 },
      { _id: "1".repeat(24), name: "Teamwork", category: "behavioral", description: "Work together", weight: 20 },
    ],
    kpis: [{ _id: "2".repeat(24), name: "Delivery", description: "Meet the target", targetValue: 90, measurementUnit: "percentage", weight: 50 }],
  };
  const html = renderToStaticMarkup(React.createElement(reviewForm.default, {
    sections: [section],
    scale: { min: 1, max: 3, levels: [{ value: 1, label: "Needs support" }, { value: 2, label: "Meets expectations" }, { value: 3, label: "Exceeds expectations" }] },
  }));
  assert.match(html, /Technical competencies/);
  assert.match(html, /Behavioural competencies/);
  assert.match(html, /Actual result \(percentage\)/);
  assert.match(html, /Target: 90 percentage/);
  assert.match(html, /Exceeds expectations/);
  assert.equal((html.match(/type="radio"/g) ?? []).length, 9);
  assert.match(html, /type="number"[^>]*required/);
  assert.match(html, /Preview answers are temporary/);
});
