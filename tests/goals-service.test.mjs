import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(fs.readFileSync(new URL("../services/goals.service.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
function service(api, token = "session-token") {
  const context = { exports: {}, require(name) {
    if (name === "@/lib/api") return { __esModule: true, default: api };
    if (name === "@/lib/auth") return { getToken: () => token };
    throw new Error(`Unexpected import: ${name}`);
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test("loads goals with backend filter names, pagination, Bearer token and cancellation", async () => {
  const signal = new AbortController().signal;
  const body = { success: true, goals: [], pagination: { page: 2, totalPages: 3 } };
  const client = service({ get: async (path, config) => {
    assert.equal(path, "/goals");
    assert.equal(config.headers.Authorization, "Bearer session-token");
    assert.equal(config.signal, signal);
    assert.deepEqual({ ...config.params }, { page: 2, planId: "plan", level: "team", status: "active", limit: 20 });
    return { data: body };
  } });
  assert.equal(await client.getGoals({ page: 2, planId: "plan", level: "team", status: "active" }, signal), body);
});

test("loads every plan/team page and only offers employees with active accounts", async () => {
  const calls = [];
  const client = service({ get: async (path, config) => {
    assert.equal(config.headers.Authorization, "Bearer session-token");
    if (path === "/employees") return { data: { employees: [{ _id: "active", user: { status: "active" } }, { _id: "invited", user: { status: "invited" } }, { _id: "missing" }] } };
    calls.push([path, config.params.page]);
    assert.equal(config.params.limit, 100);
    if (path === "/teams") assert.equal(config.params.status, "active");
    return { data: { [path === "/teams" ? "teams" : "plans"]: [{ _id: `${path}-${config.params.page}` }], pagination: { totalPages: 2 } } };
  } });
  assert.equal((await client.getGoalPlans()).length, 2);
  assert.equal((await client.getGoalTeams()).length, 2);
  assert.deepEqual(calls, [["/goal-plans", 1], ["/goal-plans", 2], ["/teams", 1], ["/teams", 2]]);
  assert.equal((await client.getGoalOwners())[0]._id, "active");
  assert.equal((await client.getGoalOwners()).length, 1);
  assert.equal((await service({ get: async () => ({ data: [{ _id: "array", user: { status: "active" } }] }) }).getGoalOwners())[0]._id, "array");
});

test("uses separate create, definition, lifecycle and check-in endpoints without synthetic deletes", async () => {
  const calls = [];
  const client = service(Object.fromEntries(["post", "patch"].map(method => [method, async (path, payload, config) => {
    assert.equal(config.headers.Authorization, "Bearer session-token");
    calls.push({ method, path, payload });
    return { data: { plan: "plan-response", goal: "goal-response", keyResult: "key-response", checkIn: "history", goalProgress: 50 } };
  }])));
  const plan = { name: "Quarter", description: "", startDate: "2027-01-01", endDate: "2027-03-31" };
  const goal = { planId: "plan", title: "Outcome", description: "", level: "individual", ownerEmployeeId: "employee" };
  const key = { title: "Reduce hours", type: "decrease", unit: "hours", startValue: 8, targetValue: 4 };
  assert.equal(await client.createGoalPlan(plan), "plan-response");
  await client.updateGoalPlan("p/1", { status: "active" });
  assert.equal(await client.createGoal(goal), "goal-response");
  await client.updateGoal("g/1", { status: "cancelled" });
  assert.equal(await client.addGoalKeyResult("g/1", key), "key-response");
  await client.updateGoalKeyResult("k/1", { title: "Rename only" });
  assert.equal((await client.recordGoalCheckIn("k/1", { value: 6, note: "Measured" })).goalProgress, 50);
  assert.deepEqual(calls, [
    { method: "post", path: "/goal-plans", payload: plan },
    { method: "patch", path: "/goal-plans/p%2F1", payload: { status: "active" } },
    { method: "post", path: "/goals", payload: goal },
    { method: "patch", path: "/goals/g%2F1", payload: { status: "cancelled" } },
    { method: "post", path: "/goals/g%2F1/key-results", payload: key },
    { method: "patch", path: "/key-results/k%2F1", payload: { title: "Rename only" } },
    { method: "post", path: "/key-results/k%2F1/check-ins", payload: { value: 6, note: "Measured" } },
  ]);
});

test("loads paginated history and propagates server errors", async () => {
  const signal = new AbortController().signal;
  const body = { checkIns: [], pagination: { page: 2, totalPages: 2 } };
  const client = service({ get: async (path, config) => {
    assert.equal(path, "/key-results/k%2F1/check-ins");
    assert.equal(config.signal, signal);
    assert.deepEqual({ ...config.params }, { page: 2, limit: 20 });
    return { data: body };
  } });
  assert.equal(await client.getGoalCheckIns("k/1", 2, signal), body);
  const failure = new Error("All key results must reach 100%");
  await assert.rejects(service({ patch: async () => { throw failure; } }).updateGoal("goal", { status: "completed" }), error => error === failure);
});

test("every operation rejects before making requests without a login session", async () => {
  const client = service(new Proxy({}, { get: () => () => assert.fail("Must not call API without token") }), null);
  for (const operation of [
    () => client.getGoalPlans(), () => client.createGoalPlan({}), () => client.updateGoalPlan("id", {}),
    () => client.getGoals({ page: 1 }), () => client.createGoal({}), () => client.updateGoal("id", {}),
    () => client.addGoalKeyResult("id", {}), () => client.updateGoalKeyResult("id", {}),
    () => client.recordGoalCheckIn("id", {}), () => client.getGoalCheckIns("id", 1),
    () => client.getGoalOwners(), () => client.getGoalTeams(),
  ]) await assert.rejects(operation(), /session has expired/);
});
