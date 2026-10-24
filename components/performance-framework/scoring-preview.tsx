"use client";

import { reviewerLabels } from "@/lib/framework-scoring";

import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { sampleRatings } from "@/lib/framework-scoring";
import { previewFrameworkScoring } from "@/services/framework-scoring.service";
import type { ReviewerRole, ScoringConfiguration, ScoringPreview } from "@/types/framework-scoring";
import { buttonClass, Field, inputClass } from "@/components/organization/ui";

const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 4 });

export default function ScoringPreviewPanel({ preview, configuration, disabled, onBusy }: {
  preview: ScoringPreview; configuration?: Partial<ScoringConfiguration>; disabled: boolean; onBusy: (busy: boolean) => void;
}) {
  const [ratings, setRatings] = useState<Partial<Record<ReviewerRole, Record<string, string>>>>({});
  const [result, setResult] = useState<ScoringPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function calculate() {
    if (busy || disabled) return;
    setError(""); setResult(null);
    try {
      const reviewerRatings = sampleRatings(preview, ratings);
      setBusy(true); onBusy(true);
      setResult(await previewFrameworkScoring(preview.frameworkId, { ...(configuration ? { configuration } : {}), reviewerRatings }));
    } catch (error) { setError(getApiErrorMessage(error)); }
    finally { setBusy(false); onBusy(false); }
  }
  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
    <h3 className="text-lg font-semibold">Scoring preview</h3>
    <p className="mt-2 text-sm text-slate-500">{configuration ? "Proposed settings, not yet saved." : "Saved settings."} Source version {preview.version}. Preview does not save configuration or review results.</p>
    <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Criterion", "Type", "Configured weight", "Effective weight"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap border-b p-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{preview.criteria.map((item) => <tr key={item.criterionId}><td className="p-3">{item.name}</td><td className="p-3 capitalize">{item.category || item.type}</td><td className="p-3">{format(item.weight)}%</td><td className="p-3">{format(item.effectiveWeight)}%</td></tr>)}</tbody></table></div>
    <p className="mt-3 text-sm font-semibold">Total effective weight: {format(preview.totalEffectiveWeight)}%</p>
    <h4 className="mb-3 mt-6 font-semibold">Try sample reviewer ratings</h4>
    <p className="mb-4 text-sm text-slate-500">Provide a rating for each enabled reviewer and positive-weight criterion. KPI targets are metadata; sample ratings use your selected scale.</p>
    <fieldset disabled={busy || disabled} className="grid gap-5 lg:grid-cols-3">{preview.enabledReviewers.map((role) => <fieldset key={role} className="space-y-4 rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold capitalize">{reviewerLabels[role]} · {preview.reviewerWeights[role]}%</legend>{preview.criteria.filter((item) => item.effectiveWeight > 0).map((item) => <Field key={item.criterionId} label={item.name}><select className={inputClass} value={ratings[role]?.[item.criterionId] ?? ""} onChange={(event) => { setRatings({ ...ratings, [role]: { ...ratings[role], [item.criterionId]: event.target.value } }); setResult(null); }}><option value="">Choose rating</option>{preview.ratingScale.levels.map((level) => <option key={level.value} value={level.value}>{level.value} — {level.label}</option>)}</select></Field>)}</fieldset>)}</fieldset>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <button type="button" className={`${buttonClass} mt-5`} disabled={busy || disabled} onClick={() => void calculate()}>{busy ? "Calculating..." : "Calculate sample score"}</button>
    {result?.sample && <div role="status" className="mt-5 rounded-xl bg-blue-50 p-5 text-sm text-blue-900"><p className="text-lg font-bold">Score: {format(result.sample.score)} / {result.ratingScale.max}</p><p className="mt-1">Normalized percentage: {format(result.sample.normalizedPercent)}%</p><p className="mt-2">{Object.entries(result.sample.reviewerScores).map(([role, score]) => `${role}: ${format(score!)}`).join(" · ")}</p><p className="mt-3 text-xs">The lowest rating maps to 0%; the highest maps to 100%. Results are calculated by the backend.</p></div>}
  </section>;
}
