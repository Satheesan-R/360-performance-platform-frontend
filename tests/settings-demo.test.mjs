import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/settings-demo.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { createDemoSettings, validateDemoSettings, parseDemoSettings } = context.exports;

test("default settings support all three employment types", () => {
  const settings = createDemoSettings();
  assert.equal(Object.keys(validateDemoSettings(settings)).length, 0);
  assert.equal(settings.reviews.intern.stages.join(","), "manager");
  assert.ok(settings.reviews.permanent.calibration);
});

test("role labels must be present, distinct and within the length limit", () => {
  for (const label of [" admin ", "", "x".repeat(41)]) {
    const settings = createDemoSettings();
    settings.roleLabels.hr = label;
    assert.ok(validateDemoSettings(settings)["role.hr"]);
  }
});

test("workflows require one manager and reject repeated or unknown stages", () => {
  for (const stages of [["self", "peer"], ["manager", "manager"], ["manager", "toString"], ["manager", null]]) {
    const settings = createDemoSettings();
    settings.reviews.permanent.stages = stages;
    assert.ok(validateDemoSettings(settings)["review.permanent"]);
  }
});

test("active notifications require a delivery channel", () => {
  const settings = createDemoSettings();
  settings.notifications.email = false;
  settings.notifications.inApp = false;
  assert.ok(validateDemoSettings(settings).channels);
  settings.notifications.reviewAssigned = false;
  settings.notifications.deadlineReminder = false;
  settings.notifications.overdueReminder = false;
  assert.equal(Object.keys(validateDemoSettings(settings)).length, 0);
});

test("deadline reminder lead time must be a whole number between 1 and 30", () => {
  for (const value of ["0", "1.5", "31", ""]) {
    const settings = createDemoSettings();
    settings.notifications.reminderDays = value;
    assert.ok(validateDemoSettings(settings).reminderDays);
    settings.notifications.deadlineReminder = false;
    assert.equal(validateDemoSettings(settings).reminderDays, undefined);
  }
});

test("required organization fields and timezone are validated", () => {
  const settings = createDemoSettings();
  settings.general.organizationName = " ";
  settings.general.contactEmail = "invalid";
  settings.general.country = "";
  settings.general.timezone = "invalid";
  const errors = validateDemoSettings(settings);
  assert.ok(errors.organizationName && errors.contactEmail && errors.country && errors.timezone);
});

test("saved demo preserves custom labels and reviewer ordering", () => {
  const settings = createDemoSettings();
  settings.roleLabels.department_manager = "HOD";
  settings.reviews.permanent.stages = ["peer", "self", "manager"];
  const savedAt = new Date().toISOString();
  const result = parseDemoSettings(JSON.stringify({ version: 1, settings, savedAt }));
  assert.ok(result);
  assert.equal(result.savedAt, savedAt);
  assert.equal(result.settings.roleLabels.department_manager, "HOD");
  assert.equal(result.settings.reviews.permanent.stages.join(","), "peer,self,manager");
});

test("corrupt, incomplete, old and invalid saved data is ignored safely", () => {
  const savedAt = new Date().toISOString();
  for (const raw of ["null", "{", "{}", JSON.stringify({ version: 5 }),
    JSON.stringify({ version: 1, savedAt: "invalid", settings: createDemoSettings() }),
    JSON.stringify({ version: 1, savedAt, settings: { general: {} } })]) {
    assert.equal(parseDemoSettings(raw), null);
  }
  const settings = createDemoSettings();
  settings.reviews.permanent.stages = ["self"];
  assert.equal(parseDemoSettings(JSON.stringify({ version: 1, savedAt, settings })), null);
});
