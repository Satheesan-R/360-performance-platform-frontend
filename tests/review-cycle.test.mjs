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

test("assigned review responses use authenticated, versioned requests scoped to the participant", async () => {
  const saved = { sections: [], version: 1, submittedAt: "2026-11-23T10:00:00.000Z" };
  const input = { sections: [], version: 0, submit: true };
  const signal = new AbortController().signal;
  const endpoint = "/review-cycles/assigned/cycle%2Fid/participants/employee%2Fid/response";
  const client = service({
    get: async (path, config) => {
      assert.equal(path, endpoint);
      assert.equal(config.signal, signal);
      assert.equal(config.headers.Authorization, "Bearer token");
      return { data: { response: saved } };
    },
    put: async (path, body, config) => {
      assert.equal(path, endpoint);
      assert.equal(body, input);
      assert.equal(config.headers.Authorization, "Bearer token");
      return { data: { response: saved } };
    },
  });
  assert.equal(await client.getAssignedReviewResponse("cycle/id", "employee/id", signal), saved);
  assert.equal(await client.saveAssignedReviewResponse("cycle/id", "employee/id", input), saved);
});
test("missing session blocks cycle requests", async () => {
  const client = service({ get: () => assert.fail("must not request") }, null);
  await assert.rejects(client.getReviewCycle("cycle"), /session has expired/);
});


test("assignments are sent in full on create, edit and clear", async () => {
  const assignments = [{ employeeId: "participant", reviewerEmployeeId: "participant", role: "self" }];
  const requests = [];
  const capture = async (path, body) => { requests.push(body); return { data: { cycle: { ...body, _id: "saved", __v: 3 } } }; };
  const client = service({ post: capture, patch: capture });
  await client.saveReviewCycle({ name: "Annual", reviewerAssignments: assignments });
  await client.saveReviewCycle({ name: "Annual", reviewerAssignments: assignments }, { _id: "saved", __v: 2 });
  await client.saveReviewCycle({ name: "Annual", reviewerAssignments: [] }, { _id: "saved", __v: 3 });
  assert.equal(requests[0].reviewerAssignments, assignments);
  assert.equal(requests[1].reviewerAssignments, assignments);
  assert.equal(requests[1].version, 2);
  assert.equal(requests[2].reviewerAssignments.length, 0);
  assert.equal(requests[2].version, 3);
});

const helperContext = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../lib/reviewer-assignments.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, helperContext);
const { eligibleReviewers, assignmentConflict, participantsWithoutReviewers } = helperContext.exports;

test("publication checks reviewer coverage for every participant", () => {
  const participants = ["roshi", "dev"];
  const assignments = [
    { employeeId: "roshi", reviewerEmployeeId: "roshi", role: "self" },
    { employeeId: "roshi", reviewerEmployeeId: "dev", role: "peer" },
  ];

  assert.deepEqual(Array.from(participantsWithoutReviewers(participants)), participants);
  assert.deepEqual(Array.from(participantsWithoutReviewers(participants, assignments)), ["dev"]);
  assert.deepEqual(Array.from(participantsWithoutReviewers(participants, [
    ...assignments, { employeeId: "dev", reviewerEmployeeId: "dev", role: "self" },
  ])), []);
});

test("reviewer options follow enabled role eligibility without limiting reviewers to participants", () => {
  const employee = (_id, role, status = "active") => ({ _id, user: { role, status } });
  const participant = { ...employee("person", "department_manager"), managerId: { _id: "manager" } };
  const employees = [participant, employee("peer", "employee"), employee("other-manager", "department_manager"), employee("lead", "tech_lead"), employee("manager", "admin"), employee("disabled", "employee", "disabled")];
  const ids = role => Array.from(eligibleReviewers(participant, role, employees), employee => employee._id);
  assert.deepEqual(ids("self"), ["person"]);
  assert.deepEqual(ids("peer"), ["peer"]);
  assert.deepEqual(ids("tech_lead"), ["lead"]);
  assert.deepEqual(ids("manager"), ["manager"]);
  assert.equal(eligibleReviewers(undefined, "self", employees).length, 0);
  assert.equal(eligibleReviewers({ ...participant, managerId: null }, "manager", employees).length, 0);
  assert.equal(eligibleReviewers({ ...participant, managerId: "manager" }, "manager", employees)[0]._id, "manager");
});

test("reviewer options list people in the participant's department first", () => {
  const participant = { _id: "person", departmentId: { _id: "engineering" }, user: { role: "employee", status: "active" } };
  const leads = [
    { _id: "other-lead", departmentId: "product", user: { role: "tech_lead", status: "active" } },
    { _id: "engineering-lead", departmentId: "engineering", user: { role: "tech_lead", status: "active" } },
  ];

  assert.deepEqual(Array.from(eligibleReviewers(participant, "tech_lead", leads), employee => employee._id), [
    "engineering-lead", "other-lead",
  ]);
});

test("duplicate reviewers and single-role slots are blocked while distinct peers are allowed", () => {
  const peer = { employeeId: "person", reviewerEmployeeId: "peer", role: "peer" };
  assert.equal(assignmentConflict([peer], peer), true);
  assert.equal(assignmentConflict([peer], { ...peer, role: "manager" }), true);
  assert.equal(assignmentConflict([peer], { ...peer, reviewerEmployeeId: "another" }), false);
  const manager = { ...peer, role: "manager" };
  assert.equal(assignmentConflict([manager], { ...manager, reviewerEmployeeId: "another" }), true);
  assert.equal(assignmentConflict([peer], { ...peer, employeeId: "other" }), false);
});
