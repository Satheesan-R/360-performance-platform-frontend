"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { validateObjective } from "@/lib/goals";
import type { GoalScope, GoalStatus, KeyResult, Objective } from "@/types/goals";

const input = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}</label>;
}

function newResult(): KeyResult {
  return { id: crypto.randomUUID(), title: "", unit: "", baseline: 0, target: 100, current: 0 };
}

export function newObjective(): Objective {
  return { id: crypto.randomUUID(), title: "", description: "", scope: "organization", owner: "", startDate: "", endDate: "", status: "draft", keyResults: [newResult()], updatedAt: "" };
}

export default function ObjectiveEditor({ initial, onSave, onCancel }: {
  initial: Objective;
  onSave: (objective: Objective) => boolean;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  function updateResult(id: string, patch: Partial<KeyResult>) {
    setValue(previous => ({ ...previous, keyResults: previous.keyResults.map(result => result.id === id ? { ...result, ...patch } : result) }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateObjective(value);
    if (problem) { setError(problem); return; }
    onSave({ ...value, title: value.title.trim(), owner: value.owner.trim(), description: value.description.trim(), keyResults: value.keyResults.map(result => ({ ...result, title: result.title.trim(), unit: result.unit.trim() })), updatedAt: new Date().toISOString() });
  }

  return (
    <section aria-labelledby="objective-editor-title" className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 sm:p-8">
      <h2 id="objective-editor-title" className="text-xl font-bold" tabIndex={-1} ref={heading}>{initial.updatedAt ? "Edit objective & progress" : "Create an objective"}</h2>
      <p className="mt-2 text-sm text-slate-500">Describe the outcome, then define the numbers that will measure success. All fields are required unless marked optional.</p>
      <form onSubmit={submit} className="mt-6 space-y-6">
        <Field label="Objective title"><input autoComplete="off" required maxLength={200} className={input} value={value.title} placeholder="Improve customer satisfaction" onChange={event => setValue({ ...value, title: event.target.value })} /></Field>
        <Field label="Description (optional)"><textarea rows={3} maxLength={2000} className={input} value={value.description} onChange={event => setValue({ ...value, description: event.target.value })} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Scope"><select className={input} value={value.scope} onChange={event => setValue({ ...value, scope: event.target.value as GoalScope })}><option value="organization">Organization</option><option value="team">Team</option><option value="individual">Individual</option></select></Field>
          <Field label="Owner name"><input required maxLength={120} className={input} value={value.owner} placeholder="Person accountable for this objective" onChange={event => setValue({ ...value, owner: event.target.value })} /><span className="mt-1 block text-xs font-normal text-slate-500">Draft name only; employee assignment will be connected later.</span></Field>
          <Field label="Start date"><input required type="date" className={input} value={value.startDate} onChange={event => setValue({ ...value, startDate: event.target.value })} /></Field>
          <Field label="End date"><input required type="date" min={value.startDate || undefined} className={input} value={value.endDate} onChange={event => setValue({ ...value, endDate: event.target.value })} /></Field>
          <Field label="Status"><select className={input} value={value.status} onChange={event => setValue({ ...value, status: event.target.value as GoalStatus })}><option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></Field>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><strong className="text-slate-800">Review-cycle alignment</strong><p className="mt-1">Use dates that match your intended review period. Linking to a review cycle will be available after cycle integration.</p></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Save browser draft</button>
          <button type="button" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
