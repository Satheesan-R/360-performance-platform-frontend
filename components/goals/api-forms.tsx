"use client";

import { useRef, useState, type ReactNode } from "react";
import { getApiErrorMessage } from "@/lib/api";
import * as goals from "@/services/goals.service";
import type { Goal, GoalKeyResult, GoalLevel, GoalPlan, KeyResultInput } from "@/types/goals-api";
import type { DirectoryPerson, TeamRecord } from "@/types/organization-views";

export const control = "mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
export const button = "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}</label>;
}
export function ActionForm({ title, children, submit, done, cancel }: {
  title: string; children: ReactNode; submit: (data: FormData) => Promise<unknown>; done: () => void; cancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  return <form className="mt-4 space-y-4 rounded-xl border border-blue-200 bg-slate-50 p-5" onSubmit={async event => {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true); setError("");
    try { await submit(data); done(); }
    catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { submitting.current = false; setPending(false); }
  }}>
    <h3 className="text-lg font-semibold">{title}</h3>
    <fieldset disabled={pending} className="space-y-4">{children}</fieldset>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex gap-3"><button className={button} disabled={pending} type="submit">{pending ? "Saving…" : "Save"}</button><button className={button} disabled={pending} type="button" onClick={cancel}>Cancel</button></div>
  </form>;
}
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
export const personName = (person: DirectoryPerson) => person.fullName || [person.firstName, person.lastName].filter(Boolean).join(" ") || person.workEmail || person.employeeNumber || person._id;

export function PlanForm({ done, cancel }: { done: () => void; cancel: () => void }) {
  return <ActionForm title="Create goal plan" done={done} cancel={cancel} submit={async data => {
    const startDate = text(data, "startDate"), endDate = text(data, "endDate");
    if (endDate < startDate) throw new Error("The end date must be on or after the start date.");
    await goals.createGoalPlan({ name: text(data, "name"), description: text(data, "description"), startDate, endDate });
  }}>
    <Field label="Plan name"><input name="name" required maxLength={200} className={control} /></Field>
    <Field label="Description (optional)"><textarea name="description" maxLength={2000} className={control} /></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Start date"><input type="date" name="startDate" required className={control} /></Field><Field label="End date"><input type="date" name="endDate" required className={control} /></Field></div>
    <p className="text-sm text-slate-600">Goals inherit these dates. New plans start as drafts.</p>
  </ActionForm>;
}

export function GoalForm({ initial, plans, owners, teams, done, cancel }: {
  initial?: Goal; plans: GoalPlan[]; owners: DirectoryPerson[]; teams: TeamRecord[]; done: () => void; cancel: () => void;
}) {
  const [level, setLevel] = useState<GoalLevel>("organization");
  return <ActionForm title={initial ? "Edit objective" : "Create objective"} done={done} cancel={cancel} submit={async data => {
    const values = { title: text(data, "title"), description: text(data, "description") };
    if (initial) await goals.updateGoal(initial._id, values);
    else await goals.createGoal({ ...values, planId: text(data, "planId"), ownerEmployeeId: text(data, "ownerEmployeeId"), level,
      ...(level === "team" ? { teamId: text(data, "teamId") } : {}) });
  }}>
    <Field label="Objective title"><input name="title" defaultValue={initial?.title} required maxLength={200} className={control} /></Field>
    <Field label="Description (optional)"><textarea name="description" defaultValue={initial?.description} maxLength={2000} className={control} /></Field>
    {!initial && <>
      <Field label="Goal plan"><select name="planId" required className={control} defaultValue=""><option value="" disabled>Select a plan</option>{plans.filter(plan => ["draft", "active"].includes(plan.status)).map(plan => <option key={plan._id} value={plan._id}>{plan.name} ({plan.status})</option>)}</select></Field>
      <Field label="Scope"><select className={control} value={level} onChange={event => setLevel(event.target.value as GoalLevel)}><option value="organization">Organization</option><option value="team">Team</option><option value="individual">Individual</option></select></Field>
      <Field label="Owner"><select name="ownerEmployeeId" required className={control} defaultValue=""><option value="" disabled>Select an active employee</option>{owners.map(person => <option key={person._id} value={person._id}>{personName(person)}{person.employeeNumber ? ` (${person.employeeNumber})` : ""}</option>)}</select></Field>
      {level === "team" && <Field label="Team"><select name="teamId" required defaultValue="" className={control}><option value="" disabled>Select an active team</option>{teams.map(team => <option key={team._id} value={team._id}>{team.name}</option>)}</select></Field>}
      <p className="text-sm text-slate-600">The plan, scope and owner cannot change after creation. Team owners must belong to or lead the selected team. Save the draft, then add key results.</p>
    </>}
  </ActionForm>;
}

export function KeyResultForm({ goalId, initial, done, cancel }: { goalId: string; initial?: GoalKeyResult; done: () => void; cancel: () => void }) {
  const [type, setType] = useState<KeyResultInput["type"]>(initial?.type ?? "increase");
  const locked = !!initial?.checkInCount;
  return <ActionForm title={initial ? "Edit key result" : "Add key result"} done={done} cancel={cancel} submit={async data => {
    const common = { title: text(data, "title"), unit: text(data, "unit") };
    if (locked && initial) { await goals.updateGoalKeyResult(initial._id, common); return; }
    const startValue = type === "milestone" ? 0 : Number(text(data, "startValue"));
    const targetValue = type === "milestone" ? 1 : Number(text(data, "targetValue"));
    if (type === "increase" && targetValue <= startValue || type === "decrease" && targetValue >= startValue) throw new Error("The target must follow the selected measurement direction.");
    const values = { ...common, type, startValue, targetValue };
    if (initial) await goals.updateGoalKeyResult(initial._id, values);
    else await goals.addGoalKeyResult(goalId, values);
  }}>
    <Field label="Measurable outcome"><input name="title" required maxLength={200} defaultValue={initial?.title} className={control} /></Field>
    <Field label="Unit (optional)"><input name="unit" maxLength={40} defaultValue={initial?.unit} className={control} /></Field>
    <Field label="Measurement"><select value={type} disabled={locked} className={control} onChange={event => setType(event.target.value as KeyResultInput["type"])}><option value="increase">Increase</option><option value="decrease">Decrease</option><option value="milestone">Milestone</option></select></Field>
    {type !== "milestone" && <div className="grid gap-4 sm:grid-cols-2">{(["startValue", "targetValue"] as const).map(key => <Field key={key} label={key === "startValue" ? "Baseline" : "Target"}><input type="number" step="any" min={-1e12} max={1e12} required disabled={locked} name={key} defaultValue={initial?.[key] ?? (key === "startValue" ? 0 : 100)} className={control} /></Field>)}</div>}
    <p className="text-sm text-slate-600">{locked ? "Measurement definitions are locked after the first check-in. Title and unit can still change." : "Progress starts at the baseline. Record measurements as check-ins once the plan and objective are active."}</p>
  </ActionForm>;
}

export function CheckInForm({ result, done, cancel }: { result: GoalKeyResult; done: () => void; cancel: () => void }) {
  return <ActionForm title={`Record progress: ${result.title}`} done={done} cancel={cancel} submit={async data => {
    await goals.recordGoalCheckIn(result._id, { value: Number(text(data, "value")), note: text(data, "note") });
  }}>
    <Field label="Current measurement">{result.type === "milestone" ? <select name="value" defaultValue={result.currentValue} className={control}><option value={0}>Not reached</option><option value={1}>Reached</option></select> : <input name="value" type="number" step="any" min={-1e12} max={1e12} required defaultValue={result.currentValue} className={control} />}</Field>
    <Field label="Note (optional)"><textarea name="note" maxLength={2000} className={control} /></Field>
  </ActionForm>;
}
