"use client";

import type { Criterion, CriteriaKind, CriteriaScoring } from "@/types/framework-criteria";
export function CriteriaScoringCards({ scoring }: { scoring: CriteriaScoring }) {
  return <section aria-label="Framework scoring summary" className="mb-6">
    <div className="grid gap-4 sm:grid-cols-3">
      {[["Active competencies", scoring.competencyCount], ["Active KPIs", scoring.kpiCount], ["Combined active weight", `${scoring.totalWeight.toLocaleString(undefined, { maximumFractionDigits: 6 })}% / 100%`]].map(([title, value]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{title}</p><p className="mt-3 text-2xl font-bold">{value}</p></div>)}
    </div>
    <p className={`mt-3 text-sm ${scoring.weightsValid ? "text-emerald-700" : "text-amber-700"}`}>{scoring.weightsValid ? "Active criteria weights total 100%." : "Active competencies and KPIs must share a combined 100% weight before activation."} Inactive items are excluded. This summary includes both tabs and all search results.</p>
  </section>;
}

export default function CriteriaTable({ kind, items, disabled, filtered, onEdit, onDeactivate }: {
  kind: CriteriaKind; items: Criterion[]; disabled: boolean; filtered: boolean;
  onEdit: (item: Criterion) => void; onDeactivate: (item: Criterion) => void;
}) {
  if (!items.length) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h3 className="font-semibold">No {kind === "competencies" ? "competencies" : "KPIs"} found</h3><p className="mt-2 text-sm text-slate-500">{filtered ? "Try another search or status filter." : `Add your first ${kind === "competencies" ? "competency" : "KPI"} to this framework.`}</p></div>;
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm">
    <thead className="bg-slate-50 text-slate-600"><tr>{["Name & description", ...(kind === "competencies" ? ["Category"] : ["Measurement unit", "Target", "Target period"]), "Weightage (%)", "Status", "Actions"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-4 font-semibold">{heading}</th>)}</tr></thead>
    <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item._id}>
      <td className="min-w-56 px-5 py-4"><p className="font-semibold">{item.name}</p><p className="mt-1 max-w-sm whitespace-pre-wrap break-words text-xs text-slate-500">{item.description || "No description"}</p></td>
      {"category" in item ? <td className="px-5 py-4 capitalize">{item.category}</td> : <><td className="px-5 py-4">{item.measurementUnit}</td><td className="px-5 py-4">{item.targetValue}</td><td className="px-5 py-4">{item.targetPeriod || "Not set"}</td></>}
      <td className="px-5 py-4">
        {item.weight}%
      </td>
      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.status === "active" ? "Active" : "Inactive"}</span></td>
      <td className="whitespace-nowrap px-5 py-4"><div className="flex gap-4"><button type="button" disabled={disabled} aria-label={`Edit ${item.name}`} className="font-semibold text-blue-600 hover:underline disabled:opacity-50" onClick={() => onEdit(item)}>Edit</button>{item.status === "active" && <button type="button" disabled={disabled} aria-label={`Deactivate ${item.name}`} className="font-semibold text-red-600 hover:underline disabled:opacity-50" onClick={() => onDeactivate(item)}>Deactivate</button>}</div></td>
    </tr>)}</tbody>
  </table></div>;
}
