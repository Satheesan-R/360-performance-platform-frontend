import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(path, imports = {}, globals = {}) {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
  const context = { exports: {}, TextEncoder, require: name => { if (!(name in imports)) throw new Error(`Unexpected import: ${name}`); return imports[name]; }, ...globals };
  vm.runInNewContext(output, context); return context.exports;
}
const model = compile("../lib/personal-settings.ts");
const { landingPages, defaultPreferences, validatePreferences, parsePreferences, cleanPreferences, preferenceKey, validateContact, validatePassword } = model;
const profileModel = compile("../lib/profile-details.ts", {}, { URL });
function setup(api = {}, options = {}) {
  const auth = { user: { id: "self-id", email: "self@example.com", role: "employee" }, token: "test-token", ...options };
  const storage = new Map();
  const client = compile("../services/personal-settings.service.ts", {
    "@/lib/auth": { getCurrentUser: () => auth.user, getToken: () => auth.token },
    "@/lib/api": { __esModule: true, default: api },
    "axios": { isAxiosError: value => value?.isAxiosError === true },
    "@/lib/personal-settings": model,
  }, { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { if (auth.storageUnavailable) throw new Error("Storage blocked"); storage.set(key, value); } } });
  return { client, storage, auth };
}

test("all existing roles have a valid default and a strict landing-page allowlist", () => {
  for (const role of Object.keys(landingPages)) {
    assert.equal(Object.keys(validatePreferences(defaultPreferences(role), role)).length, 0);
    for (const path of ["https://example.com", "//example.com", "/unknown", "/settings"]) assert.ok(validatePreferences({ ...defaultPreferences(role), landingPage: path }, role).landingPage);
  }
  assert.ok(validatePreferences({ ...defaultPreferences("employee"), landingPage: "/admin/configuration" }, "employee").landingPage);
});
test("unsupported locale, timezone, theme and notification values are rejected", () => {
  const prefs = defaultPreferences("employee");
  prefs.language = "fr"; prefs.timezone = "Invalid/Zone"; prefs.theme = "unknown"; prefs.notifications.email = "true";
  const errors = validatePreferences(prefs, "employee");
  for (const key of ["language", "timezone", "theme", "notifications"]) assert.ok(errors[key]);
  for (const value of [null, {}, { ...prefs, notifications: null }]) assert.equal(parsePreferences(value, "employee"), null);
});
test("personal preference allowlist strips credentials, identity, company policies and mandatory notification overrides", () => {
  const value = defaultPreferences("employee");
  Object.assign(value, { userId: "other", role: "admin", password: "never-store", reviewPolicy: {} });
  value.notifications.security = false;
  const clean = cleanPreferences(value);
  for (const key of ["userId", "role", "password", "reviewPolicy"]) assert.equal(clean[key], undefined);
  assert.equal(clean.notifications.security, undefined);
  assert.notEqual(preferenceKey("user-one"), preferenceKey("user-two"));
});
test("contact validation matches permitted phone and address constraints", () => {
  assert.equal(Object.keys(validateContact("+94 77 123 4567", "Personal address")).length, 0);
  assert.equal(Object.keys(validateContact("", "")).length, 0);
  for (const phone of ["abc", "123", "1234567890123456"]) assert.ok(validateContact(phone, "").phone);
  assert.ok(validateContact("", "x".repeat(301)).address);
});

test("appearance validates supported palettes, motion, contrast and bounded whole-number font sizes", () => {
  const prefs = defaultPreferences("employee");
  for (const appearance of [null, {}, { ...prefs.appearance, accent: "red" }, { ...prefs.appearance, reduceMotion: true }, { ...prefs.appearance, contrast: "unknown" }, ...[NaN, 13, 19, 15.5, "16"].map(fontSize => ({ ...prefs.appearance, fontSize }))]) {
    assert.ok(validatePreferences({ ...prefs, appearance }, "employee").appearance);
    assert.equal(parsePreferences({ ...prefs, appearance }, "employee"), null);
  }
  for (const accent of ["blue", "teal", "violet"]) for (const fontSize of [14, 16, 18]) {
    assert.equal(Object.keys(validatePreferences({ ...prefs, appearance: { accent, fontSize, reduceMotion: "on", contrast: "high" } }, "employee")).length, 0);
  }
  const clean = cleanPreferences({ ...prefs, appearance: { ...prefs.appearance, password: "never-store", background: "url(evil)" } });
  assert.deepEqual(Object.keys(clean.appearance).sort(), ["accent", "contrast", "fontSize", "reduceMotion"]);
});

test("preferences from existing accounts and browser previews acquire safe appearance defaults", () => {
  const previous = defaultPreferences("employee"); delete previous.appearance;
  const parsed = parsePreferences(previous, "employee");
  assert.equal(parsed.appearance.accent, "blue"); assert.equal(parsed.appearance.fontSize, 16);
  assert.equal(parsed.appearance.reduceMotion, "system"); assert.equal(parsed.appearance.contrast, "standard");
  const first = defaultPreferences("employee"); first.appearance.accent = "teal";
  assert.equal(defaultPreferences("employee").appearance.accent, "blue");
});
test("password validation handles current-password presence, confirmation, change and bcrypt byte limits", () => {
  assert.ok(validatePassword("", "NewPassword2", "NewPassword2").current);
  assert.ok(validatePassword("OldPassword1", "short", "short").next);
  assert.ok(validatePassword("OldPassword1", "OldPassword1", "OldPassword1").next);
  assert.ok(validatePassword("OldPassword1", "NewPassword2", "mismatch").confirm);
  assert.ok(validatePassword("OldPassword1", "😀".repeat(20), "😀".repeat(20)).next);
  assert.equal(Object.keys(validatePassword("OldPassword1", "NewPassword2", "NewPassword2")).length, 0);
});
test("profile reads use the existing self-service endpoint and verify response ownership", async () => {
  const { client } = setup({ get: async (path, config) => { assert.equal(path, "/settings/profile"); assert.equal(config.headers.Authorization, "Bearer test-token"); return { data: { profile: { id: "self-id", role: "employee", email: "self@example.com", employee: null } } }; } });
  assert.equal((await client.getSelfProfile()).id, "self-id");
  const invalid = setup({ get: async () => ({ data: { profile: { id: "other", role: "employee" } } }) });
  await assert.rejects(invalid.client.getSelfProfile(), /identity does not match/);
});
test("profile updates strip server-owned fields and never accept another account as target", async () => {
  const { client, auth } = setup({ patch: async (path, body) => { assert.equal(path, "/settings/profile"); assert.equal(body.phone, "+94 77 123 4567"); assert.equal(body.role, undefined); assert.equal(body.userId, undefined); return { data: { profile: { id: "self-id", role: "employee" } } }; } });
  await client.updateSelfProfile({ phone: " +94 77 123 4567 ", role: "admin", userId: "other" }, "self-id");
  auth.user = { ...auth.user, id: "other" };
  await assert.rejects(client.updateSelfProfile({ phone: "" }, "self-id"), /account changed/);
});
test("password change sends only credentials to the existing authenticated endpoint and never persists them", async () => {
  const { client, storage } = setup({ patch: async (path, body, config) => { assert.equal(path, "/settings/password"); assert.equal(config.headers.Authorization, "Bearer test-token"); assert.deepEqual(Object.keys(body).sort(), ["currentPassword", "newPassword"]); return { data: { success: true } }; } });
  await client.changeSelfPassword("OldPassword1", "NewPassword2", "self-id");
  assert.equal(storage.size, 0);
});
test("server saves send only supported fields and keep advanced notification options in account-scoped browser storage", async () => {
  const value = defaultPreferences("employee"); value.theme = "dark";
  value.notifications.delivery.frequency = "weekly";
  const { client, storage } = setup({ get: async path => { assert.equal(path, "/settings/preferences"); return { data: { preferences: value } }; }, patch: async (path, body) => { assert.equal(path, "/settings/preferences"); assert.equal(body.notifications.delivery, undefined); return { data: { preferences: body } }; } });
  const loaded = await client.getSelfPreferences(); assert.equal(loaded.source, "server");
  const saved = await client.saveSelfPreferences(value, loaded.source, "self-id");
  assert.equal(saved.theme, "dark"); assert.equal(saved.notifications.delivery.frequency, "weekly");
  assert.equal(storage.size, 1);
  assert.equal(storage.has(preferenceKey("self-id")), false);
  assert.equal(JSON.parse(storage.get(model.notificationDeliveryKey("self-id"))).frequency, "weekly");
  assert.equal((await client.getSelfPreferences()).preferences.notifications.delivery.frequency, "weekly");
});

test("older notification preferences migrate without re-enabling muted categories", () => {
  const value = defaultPreferences("employee");
  delete value.notifications.delivery; value.notifications.goals = false; value.notifications.email = false;
  const migrated = parsePreferences(value, "employee");
  assert.equal(migrated.notifications.email, false);
  assert.equal(migrated.notifications.delivery.channels.goals.email, false);
  assert.equal(migrated.notifications.delivery.channels.goals.inApp, false);
  assert.equal(migrated.notifications.delivery.channels.reviews.inApp, true);
  migrated.notifications.delivery.channels.reviews.inApp = false;
  assert.equal(defaultPreferences("employee").notifications.delivery.channels.reviews.inApp, true);
});

test("delivery schedules, event flags and category channels reject invalid values", () => {
  const base = defaultPreferences("employee");
  const invalid = [null, { ...base.notifications.delivery, frequency: "hourly" }, { ...base.notifications.delivery, digestDay: 7 }, { ...base.notifications.delivery, digestTime: "24:00" }, { ...base.notifications.delivery, channels: {} }, { ...base.notifications.delivery, mentions: { direct: "yes", replies: true } }];
  for (const daysBefore of [0, 31, 1.5, "3", NaN]) invalid.push({ ...base.notifications.delivery, reminders: { ...base.notifications.delivery.reminders, daysBefore } });
  for (const delivery of invalid) assert.equal(parsePreferences({ ...base, notifications: { ...base.notifications, delivery } }, "employee"), null);
  for (const frequency of ["instant", "daily", "weekly"]) {
    assert.ok(parsePreferences({ ...base, notifications: { ...base.notifications, delivery: { ...base.notifications.delivery, frequency } } }, "employee"));
  }
  base.notifications.delivery.manager.userId = "another-user";
  base.notifications.delivery.channels.goals.security = false;
  const clean = cleanPreferences(base);
  assert.equal(clean.notifications.delivery.manager.userId, undefined);
  assert.equal(clean.notifications.delivery.channels.goals.security, undefined);
  assert.equal(model.hasManagerAlerts("employee"), false);
  for (const role of ["department_manager", "tech_lead", "hr", "admin"]) assert.equal(model.hasManagerAlerts(role), true);
});

test("advanced notification choices survive reloads, remain account-scoped and ignore corrupted storage", async () => {
  const server = defaultPreferences("employee"); delete server.notifications.delivery;
  const { client, storage, auth } = setup({ get: async () => ({ data: { preferences: server } }), patch: async (_, body) => ({ data: { preferences: body } }) });
  const value = defaultPreferences("employee"); value.notifications.delivery.digestTime = "17:30";
  value.notifications.delivery.mentions.replies = false;
  await client.saveSelfPreferences(value, "server", "self-id");
  const loaded = await client.getSelfPreferences();
  assert.equal(loaded.preferences.notifications.delivery.digestTime, "17:30");
  assert.equal(loaded.preferences.notifications.delivery.mentions.replies, false);
  auth.user = { ...auth.user, id: "other-id" };
  assert.equal((await client.getSelfPreferences()).preferences.notifications.delivery.digestTime, "09:00");
  storage.set(model.notificationDeliveryKey("other-id"), '{"frequency":"invalid"}');
  const reset = await client.getSelfPreferences();
  assert.equal(reset.preferences.notifications.delivery.frequency, "instant");
  assert.match(reset.notice, /reset/);
});

test("blocked browser storage reports partial save accurately and API failure never persists delivery choices", async () => {
  const blocked = setup({ patch: async (_, body) => ({ data: { preferences: body } }) }, { storageUnavailable: true });
  await assert.rejects(blocked.client.saveSelfPreferences(defaultPreferences("employee"), "server", "self-id"), /Account preferences were saved, but advanced notification options could not/);
  const failed = setup({ patch: async () => { throw new Error("API unavailable"); } });
  await assert.rejects(failed.client.saveSelfPreferences(defaultPreferences("employee"), "server", "self-id"), /API unavailable/);
  assert.equal(failed.storage.size, 0);
});
test("only explicit missing/unsupported preference APIs enable a clearly marked browser preview", async () => {
  for (const status of [404, 501]) {
    const { client, storage } = setup({ get: async () => { throw { isAxiosError: true, response: { status } }; } });
    const result = await client.getSelfPreferences(); assert.equal(result.source, "browser"); assert.match(result.notice, /browser-only preview/);
    await client.saveSelfPreferences({ ...result.preferences, theme: "dark", password: "never-store" }, result.source, "self-id");
    assert.equal(storage.size, 1); assert.equal([...storage.values()][0].includes("never-store"), false);
  }
  for (const status of [401, 403, 500, 503]) {
    const { client, storage } = setup({ get: async () => { throw { isAxiosError: true, response: { status } }; } });
    await assert.rejects(client.getSelfPreferences()); assert.equal(storage.size, 0);
  }
});
test("unauthenticated requests are blocked and server errors never become fake profile/save successes", async () => {
  const missing = setup({}, { token: null });
  await assert.rejects(missing.client.getSelfProfile(), /session has expired/);
  const failed = setup({ get: async () => { throw new Error("offline"); }, patch: async () => { throw new Error("offline"); } });
  await assert.rejects(failed.client.getSelfProfile(), /offline/);
  await assert.rejects(failed.client.saveSelfPreferences(defaultPreferences("employee"), "server", "self-id"), /offline/);
  assert.equal(failed.storage.size, 0);
});

test("profile details validate boundaries, duplicate skills, photo data and safe professional links", () => {
  const base = profileModel.defaultProfileDetails();
  assert.equal(Object.keys(profileModel.validateProfileDetails(base)).length, 0);
  assert.equal(base.careerVisibility, "private");
  for (const bio of ["x".repeat(501), null]) assert.ok(profileModel.validateProfileDetails({ ...base, bio }).bio);
  assert.ok(profileModel.validateProfileDetails({ ...base, careerInterests: "x".repeat(1001) }).careerInterests);
  assert.ok(profileModel.validateProfileDetails({ ...base, photo: "data:image/svg+xml;base64,AAAA" }).photo);
  assert.ok(profileModel.validateProfileDetails({ ...base, skills: [{ name: "React", proficiency: "advanced", developing: true }, { name: " react ", proficiency: "learning", developing: false }] }).skills);
  for (const url of ["javascript:alert(1)", "data:text/html,test", "file:///secret", "https://user:password@example.com", "invalid"]) {
    assert.equal(profileModel.safeProfessionalUrl(url), false);
    assert.ok(profileModel.validateProfileDetails({ ...base, links: [{ label: "Portfolio", url }] }).links);
  }
  const cleaned = profileModel.cleanProfileDetails({ ...base, bio: " My bio ", userId: "other", skills: [{ name: " React ", proficiency: "advanced", developing: true, verified: true }], links: [{ label: " Portfolio ", url: " https://example.com " }] });
  assert.equal(cleaned.bio, "My bio"); assert.equal(cleaned.userId, undefined); assert.equal(cleaned.skills[0].verified, undefined);
  assert.equal(cleaned.links[0].url, "https://example.com");
});

test("profile service sends allowlisted account details, submits real corrections and blocks changed accounts", async () => {
  let auth = { id: "self-id", role: "employee" };
  const base = profileModel.defaultProfileDetails();
  const requests = [];
  const client = compile("../services/profile-details.service.ts", {
    "@/lib/auth": { getCurrentUser: () => auth, getToken: () => "token" },
    "@/lib/profile-details": profileModel,
    "@/lib/api": { __esModule: true, default: {
      patch: async (path, body, config) => { requests.push({ path, body, config }); return { data: { profile: { id: "self-id", details: body.details } } }; },
      post: async (path, body, config) => { requests.push({ path, body, config }); return { data: { correction: { id: "request-id", ...body, status: "pending" } } }; },
      get: async () => ({ data: { corrections: [] } }),
    } },
  });
  const saved = await client.saveProfileDetails({ ...base, bio: " Hello ", role: "admin" }, "self-id");
  assert.equal(saved.details.bio, "Hello"); assert.equal(requests[0].body.details.role, undefined);
  assert.equal(requests[0].path, "/settings/profile"); assert.equal(requests[0].config.headers.Authorization, "Bearer token");
  const correction = await client.submitProfileCorrection({ field: "jobTitle", proposedValue: " Senior engineer ", reason: " Correct my title ", requester: "other" }, "self-id");
  assert.equal(correction.status, "pending"); assert.equal(requests[1].body.requester, undefined);
  assert.equal(requests[1].body.proposedValue, "Senior engineer");
  await assert.rejects(client.submitProfileCorrection({ field: "role", proposedValue: "admin", reason: "Override" }, "self-id"), /correction details/);
  auth = { ...auth, id: "another-id" };
  await assert.rejects(client.saveProfileDetails(base, "self-id"), /account changed/);
  assert.equal(requests.length, 2);
});
