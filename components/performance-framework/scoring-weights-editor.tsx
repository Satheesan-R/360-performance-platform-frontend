"use client";

import { reviewerLabels, reviewerRoles, type ScoringDraft } from "@/lib/framework-scoring";
import { Field, inputClass } from "@/components/organization/ui";

function Total({ values }: { values: string[] }) {
  const valid = values.every((value) => value.trim() && Number.isFinite(Number(value)));
  const total = values.reduce((sum, value) => sum + Number(value), 0);
  return <p className={`mt-4 text-sm ${valid && Math.abs(total - 100) < 0.000001 ? "text-emerald-700" : "text-amber-700"}`}>Total: {valid ? `${total.toLocaleString(undefined, { maximumFractionDigits: 6 })}% / 100%` : "Enter every weight"}</p>;
}

export default function ScoringWeightsEditor({ draft, disabled, onChange }: { draft: ScoringDraft; disabled: boolean; onChange: (draft: ScoringDraft) => void }) {
  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold">Competency category weights</h3>
      <p className="mb-4 mt-2 text-sm leading-6 text-slate-500">Split the competency share between Technical and Behavioral. KPI weights stay unchanged. These percentages are separate from the combined criterion weights.</p>
      <label className="mb-5 flex items-center gap-3 text-sm font-medium"><input type="checkbox" disabled={disabled} checked={draft.editCategories} onChange={(event) => onChange({ ...draft, editCategories: event.target.checked })} />Include category weights in this save</label>
      <fieldset disabled={disabled || !draft.editCategories} className="grid gap-4 sm:grid-cols-2">{(["technical", "behavioral"] as const).map((category) => <Field key={category} label={`${category === "technical" ? "Technical" : "Behavioral"} (%)`}><input type="number" min={0} max={100} step="any" className={inputClass} value={draft.categories[category]} onChange={(event) => onChange({ ...draft, categories: { ...draft.categories, [category]: event.target.value } })} /></Field>)}</fieldset>
      <Total values={Object.values(draft.categories)} />
      <p className="mt-3 text-xs text-slate-500">A category with positive weight needs a positive-weight active competency. For KPI-only frameworks these settings are retained but unused.</p>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold">Reviewer weights</h3>
      <p className="mb-4 mt-2 text-sm text-slate-500">Choose who contributes to the final score and set their shares.</p>
      <label className="mb-5 flex items-center gap-3 text-sm font-medium"><input type="checkbox" disabled={disabled} checked={draft.editReviewers} onChange={(event) => onChange({ ...draft, editReviewers: event.target.checked })} />Include reviewer settings in this save</label>
      <fieldset disabled={disabled || !draft.editReviewers} className="space-y-4">{reviewerRoles.map((role) => <div key={role} className="grid grid-cols-2 items-end gap-4"><label className="flex items-center gap-3 py-3 text-sm font-medium capitalize"><input type="checkbox" checked={draft.enabledReviewers.includes(role)} onChange={(event) => onChange({ ...draft, enabledReviewers: event.target.checked ? [...draft.enabledReviewers, role] : draft.enabledReviewers.filter((value) => value !== role), reviewers: event.target.checked ? draft.reviewers : { ...draft.reviewers, [role]: "0" } })} />{reviewerLabels[role]}</label><Field label={`${reviewerLabels[role]} (%)`}><input type="number" min={0} max={100} step="any" disabled={!draft.enabledReviewers.includes(role)} className={inputClass} value={draft.reviewers[role]} onChange={(event) => onChange({ ...draft, reviewers: { ...draft.reviewers, [role]: event.target.value } })} /></Field></div>)}</fieldset>
      <Total values={Object.values(draft.reviewers)} />
      <p className="mt-3 text-xs text-slate-500">Enabled reviewers need positive weights; disabled reviewers need 0%. Disabling a reviewer sets their weight to zero; redistribute the remaining shares yourself.</p>
    </section>
  </div>;
}
