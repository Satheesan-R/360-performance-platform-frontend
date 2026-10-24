"use client";

import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { criterionInput, type CriterionDraft } from "@/lib/framework-criteria";
import type { CompetencyInput, Criterion, CriteriaKind, KpiInput } from "@/types/framework-criteria";
import { buttonClass, Field, inputClass, secondaryClass } from "@/components/organization/ui";

export default function CriterionForm({ kind, item, disabled, onSave, onCancel }: {
  kind: CriteriaKind; item: Criterion | null; disabled: boolean;
  onSave: (values: CompetencyInput | KpiInput) => Promise<void>; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CriterionDraft>({
    name: item?.name ?? "",
    description: item?.description ?? "",
    weight: item ? String(item.weight) : "",
    status: item?.status ?? "active",
    category: item && "category" in item ? item.category : "technical",
    measurementUnit: item && "measurementUnit" in item ? item.measurementUnit : "",
    targetValue: item && "targetValue" in item ? String(item.targetValue) : "",
    targetPeriod: item && "targetPeriod" in item ? item.targetPeriod ?? "" : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const noun = kind === "competencies" ? "Competency" : "KPI";
  const set = (field: keyof CriterionDraft, value: string) => setDraft((draft) => ({ ...draft, [field]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || disabled) return;
    setError("");
    try {
      const values = kind === "competencies" ? criterionInput("competencies", draft) : criterionInput("kpis", draft);
      setSaving(true);
      await onSave(values);
    } catch (error) { setError(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="mb-5 text-lg font-bold">{item ? "Edit" : "Add"} {noun}</h3>
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <fieldset disabled={saving || disabled} className="grid gap-5 sm:grid-cols-2">
      <Field label={`${noun} name *`}><input autoFocus required maxLength={200} className={inputClass} value={draft.name} onChange={(event) => set("name", event.target.value)} /></Field>
      {kind === "competencies" ? <Field label="Category"><select className={inputClass} value={draft.category} onChange={(event) => set("category", event.target.value)}><option value="technical">Technical</option><option value="behavioral">Behavioral</option></select></Field> : <Field label="Measurement unit *"><input required maxLength={200} className={inputClass} value={draft.measurementUnit} onChange={(event) => set("measurementUnit", event.target.value)} placeholder="percentage, tickets, days..." /></Field>}
      <div className="sm:col-span-2"><Field label="Description"><textarea rows={3} maxLength={2000} className={inputClass} value={draft.description} onChange={(event) => set("description", event.target.value)} /></Field></div>
      <Field label="Weightage percentage *">
        <input
          aria-label="Weightage percentage"
          required
          type="number"
          min={0}
          max={100}
          step="any"
          className={inputClass}
          value={draft.weight}
          onChange={(event) => set("weight", event.target.value)}
          placeholder="e.g. 20"
        />
      </Field>
      <Field label="Status"><select className={inputClass} value={draft.status} onChange={(event) => set("status", event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
      {kind === "kpis" && <><Field label="Target value *"><input required type="number" step="any" className={inputClass} value={draft.targetValue} onChange={(event) => set("targetValue", event.target.value)} /></Field><Field label="Target period (optional)"><input maxLength={200} className={inputClass} value={draft.targetPeriod} onChange={(event) => set("targetPeriod", event.target.value)} placeholder="Quarter 1" /></Field></>}
    </fieldset>
    <p className="mt-5 text-xs text-slate-500">
      Enter a weightage between 0 and 100%. Active competencies and KPIs must share a combined 100% weight before framework activation.
      {kind === "kpis" && " KPI targets may be zero or negative when appropriate for the measurement unit."}
    </p>
    <div className="mt-6 flex gap-3"><button type="submit" className={buttonClass} disabled={saving || disabled}>{saving ? "Saving..." : item ? "Save changes" : `Add ${noun}`}</button><button type="button" className={secondaryClass} disabled={saving} onClick={onCancel}>Cancel</button></div>
  </form>;
}
