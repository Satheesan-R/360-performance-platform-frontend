"use client";

import { useRef, useState, type ReactNode } from "react";
import { getApiErrorMessage } from "@/lib/api";
import * as goals from "@/services/goals.service";
import type { DirectoryPerson } from "@/types/organization-views";

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

