"use client";

import { useState } from "react";
import type { Employee } from "@/types/employee";
import type { ReviewerAssignment, ReviewerRole } from "@/types/review-cycle";
import { assignmentConflict, eligibleReviewers, reviewerRoleLabels } from "@/lib/reviewer-assignments";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2";
const button = "rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50";
export default function ReviewerAssignments({ participantIds, employees, roles, assignments, loading, error, onRetry, onChange }: {
  participantIds: string[]; employees: Employee[]; roles: ReviewerRole[];
  assignments: ReviewerAssignment[]; loading: boolean; error: string;
  onRetry: () => void; onChange: (assignments: ReviewerAssignment[]) => void;
}) {
  const [participantId, setParticipantId] = useState("");
  const [selectedRole, setRole] = useState<ReviewerRole>("self");
  const [reviewerId, setReviewerId] = useState("");
  const employeeId = participantIds.includes(participantId) ? participantId : participantIds[0] ?? "";
  const role = roles.includes(selectedRole) ? selectedRole : roles[0];
  const participant = employees.find(employee => employee._id === employeeId);
  const candidates = role ? eligibleReviewers(participant, role, employees) : [];
  const reviewerEmployeeId = role === "self" ? employeeId : reviewerId;
  const next = role ? { employeeId, reviewerEmployeeId, role } : undefined;
  const duplicate = next && assignmentConflict(assignments, next);
  const canAdd = !loading && !error && next && candidates.some(employee => employee._id === reviewerEmployeeId) && !duplicate && assignments.length < 2000;
  const name = (id: string) => {
    const employee = employees.find(employee => employee._id === id);
    return employee ? `${employee.firstName} ${employee.lastName} (${employee.workEmail})` : `Unavailable employee (${id})`;
  };
  return <fieldset className="space-y-3 border-t border-slate-200 pt-4">
    <legend className="font-semibold">Reviewer Assignments ({assignments.length}/2000)</legend>
    <p className="text-sm text-slate-500">Assignments are optional while drafting. Manager reviewers follow the participant?s reporting manager. You can save an incomplete list.</p>
    {loading ? <p role="status">Loading enabled reviewer roles?</p> : error ? <p role="alert">{error} <button type="button" className={button} onClick={onRetry}>Retry reviewer roles</button></p> : !roles.length ? <p>Select an approved template to load its enabled reviewer roles.</p> : <>
      {!participantIds.length ? <p>Select participants above to assign reviewers.</p> : <div className="grid gap-3 md:grid-cols-3">
        <label>Participant<select className={field} value={employeeId} onChange={event => { setParticipantId(event.target.value); setReviewerId(""); }}>
          {participantIds.map(id => <option key={id} value={id}>{name(id)}</option>)}
        </select></label>
        <label>Reviewer role<select className={field} value={role} onChange={event => { setRole(event.target.value as ReviewerRole); setReviewerId(""); }}>
          {roles.map(value => <option key={value} value={value}>{reviewerRoleLabels[value]}</option>)}
        </select></label>
        <label>Reviewer{role === "self" ? <input className={field} readOnly value={name(employeeId)} /> : <select className={field} value={candidates.some(employee => employee._id === reviewerId) ? reviewerId : ""} onChange={event => setReviewerId(event.target.value)}>
          <option value="">Select a reviewer</option>
          {candidates.map(employee => <option key={employee._id} value={employee._id}>{name(employee._id)}</option>)}
        </select>}</label>
      </div>}
      {!!participantIds.length && !candidates.length && <p>No eligible reviewer is available for this participant and role. Check their active account and reporting manager.</p>}
      {duplicate && <p>This reviewer or role is already assigned to this participant.</p>}
      <button type="button" className={button} disabled={!canAdd} onClick={() => { if (canAdd && next) { onChange([...assignments, next]); setReviewerId(""); } }}>Add assignment</button>
    </>}
    {assignments.length ? <>
      <ul className="divide-y divide-slate-200">{assignments.map((assignment, index) => <li key={`${assignment.employeeId}:${assignment.reviewerEmployeeId}:${assignment.role}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><p className="font-medium">{name(assignment.employeeId)}</p><p className="text-sm text-slate-600">{reviewerRoleLabels[assignment.role] ?? assignment.role}: {name(assignment.reviewerEmployeeId)}</p></div>
        <button type="button" className={button} aria-label={`Remove ${reviewerRoleLabels[assignment.role]} reviewer for ${name(assignment.employeeId)}`} onClick={() => onChange(assignments.filter((_, i) => i !== index))}>Remove</button>
      </li>)}</ul>
      <button type="button" className={button} onClick={() => onChange([])}>Clear all assignments</button>
    </> : <p className="text-sm text-slate-500">No reviewers assigned yet.</p>}
  </fieldset>;
}
