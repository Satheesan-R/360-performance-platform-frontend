"use client";

import type { ScoringDraft } from "@/lib/framework-scoring";
import { Field, inputClass } from "@/components/organization/ui";

export default function RatingScaleEditor({ draft, disabled, onChange }: { draft: ScoringDraft; disabled: boolean; onChange: (draft: ScoringDraft) => void }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6">
    <h3 className="text-lg font-semibold">Rating scale</h3>
    <p className="mb-4 mt-2 text-sm text-slate-500">Define the meaning of each rating. Labels are specific to your organization.</p>
    <label className="mb-5 flex items-center gap-3 text-sm font-medium"><input type="checkbox" disabled={disabled} checked={draft.editScale} onChange={(event) => onChange({ ...draft, editScale: event.target.checked })} />Include rating scale in this save</label>
    <fieldset disabled={disabled || !draft.editScale} className="space-y-4">
      <Field label="Rating range"><select className={inputClass} value={draft.max} onChange={(event) => onChange({ ...draft, max: event.target.value ? Number(event.target.value) as 3 | 4 | 5 : "" })}><option value="">Choose a scale</option>{([3, 4, 5] as const).map((max) => <option key={max} value={max}>1–{max}</option>)}</select></Field>
      {draft.max && Array.from({ length: draft.max }, (_, index) => <Field key={index} label={`Level ${index + 1} label`}><input className={inputClass} maxLength={200} value={draft.labels[index]} onChange={(event) => onChange({ ...draft, labels: draft.labels.map((label, position) => position === index ? event.target.value : label) })} placeholder={`Meaning of rating ${index + 1}`} /></Field>)}
    </fieldset>
    <p className="mt-4 text-xs text-slate-500">Unselected sections keep their saved configuration. Every level needs a label when this section is included.</p>
  </section>;
}
