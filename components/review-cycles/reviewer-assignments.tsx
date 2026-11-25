"use client";

import { useState } from "react";
import type { Employee } from "@/types/employee";
import type { ReviewerAssignment, ReviewerRole } from "@/types/review-cycle";
import { assignmentConflict, eligibleReviewers, participantsWithoutReviewers, reviewerDepartmentId, reviewerRoleLabels } from "@/lib/reviewer-assignments";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2";
const button = "rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50";
export default function ReviewerAssignments({ participantIds, employees, roles, assignments, loading, error, onRetry, onChange }: {
  participantIds: string[]; employees: Employee[]; roles: ReviewerRole[];
  assignments: ReviewerAssignment[]; loading: boolean; error: string;
  onRetry: () => void; onChange: (assignments: ReviewerAssignment[]) => void;
}) {
  const [participantId, setParticipantId] = useState("");
  const [selection, setSelection] = useState<{ employeeId: string; ids: Partial<Record<ReviewerRole, string>> }>();
  const employeeId = participantIds.includes(participantId) ? participantId : participantIds[0] ?? "";
  const participant = employees.find(employee => employee._id === employeeId);
  const missing = participantsWithoutReviewers(participantIds, assignments);
  const departmentId = participant && reviewerDepartmentId(participant);
  const reviewerIds = selection?.employeeId === employeeId ? selection.ids : {};
  function selectReviewer(role: ReviewerRole, id: string) {
    setSelection({ employeeId, ids: { ...reviewerIds, [role]: id } });
  }
  const name = (id: string) => {
    const employee = employees.find(employee => employee._id === id);
    return employee ? `${employee.firstName} ${employee.lastName} (${employee.workEmail})` : `Unavailable employee (${id})`;
  };
  return <fieldset className="space-y-3 border-t border-slate-200 pt-4">
    <legend className="font-semibold">Reviewer Assignments ({assignments.length}/2000)</legend>
    <p className="text-sm text-slate-500">Add reviewers for the roles enabled by the template. You can save an incomplete list while drafting.</p>
    {missing.length > 0 && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-medium">Add at least one reviewer for each of these participants before publishing.</p>
      <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5">
        {missing.map(id => <li key={id}>{name(id)}</li>)}
      </ul>
    </div>}
    {loading ? <p role="status">Loading enabled reviewer roles…</p> : error ? <p role="alert">{error} <button type="button" className={button} onClick={onRetry}>Retry reviewer roles</button></p> : !roles.length ? <p>Select an approved template with enabled reviewer roles.</p> : !employeeId ? <p>Select participants above to assign reviewers.</p> : <>
        <label className="block">Participant<select className={field} value={employeeId} onChange={event => { setParticipantId(event.target.value); setSelection(undefined); }}>
          {participantIds.map(id => <option key={id} value={id}>{name(id)}</option>)}
        </select></label>
        {roles.map(role => {
          const label = reviewerRoleLabels[role];
          const assigned = assignments.find(item => item.employeeId === employeeId && item.role === role);
          const fixed = role === "self" || role === "manager";
          const candidates = eligibleReviewers(participant, role, employees);
          const available = candidates.filter(employee => !assignmentConflict(assignments, { employeeId, reviewerEmployeeId: employee._id, role }));
          const reviewer = fixed ? candidates[0] : available.find(employee => employee._id === reviewerIds[role]);
          const next = reviewer && { employeeId, reviewerEmployeeId: reviewer._id, role };
          const canAdd = Boolean(next && available.includes(reviewer) && assignments.length < 2000);

          return <div key={role} className="flex flex-wrap items-end gap-2">
            <label className="min-w-56 flex-1">{label}
              {fixed ? <input className={field} readOnly value={reviewer ? name(reviewer._id) : role === "manager" ? "No active reporting manager" : "Participant unavailable"} /> :
                <select className={field} value={reviewer?._id ?? ""} disabled={!available.length} onChange={event => selectReviewer(role, event.target.value)}>
                  <option value="">{available.length ? `Select ${label.toLowerCase()}` : assigned ? "Assigned" : "No eligible reviewer available"}</option>
                  {available.map(employee => <option key={employee._id} value={employee._id}>
                    {name(employee._id)}{departmentId && reviewerDepartmentId(employee) === departmentId ? " · Same department" : ""}
                  </option>)}
                </select>}
            </label>
            <button type="button" className={button} disabled={!canAdd} onClick={() => {
              if (!canAdd || !next) return;
              onChange([...assignments, next]);
              selectReviewer(role, "");
            }}>{assigned && role !== "peer" ? "Assigned" : `Add ${label.toLowerCase()}`}</button>
          </div>;
        })}
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
