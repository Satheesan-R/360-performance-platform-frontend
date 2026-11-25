"use client";

import type {
  Criterion,
  CriteriaKind,
  CriteriaScoring,
} from "@/types/framework-criteria";

export function CriteriaScoringCards({
  scoring,
}: {
  scoring: CriteriaScoring;
}) {
  return (
    <section
      aria-label="Framework scoring summary"
      className="mb-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Active competencies", scoring.competencyCount],
          ["Active KPIs", scoring.kpiCount],
          [
            "Combined active weight",
            `${scoring.totalWeight.toLocaleString(undefined, { maximumFractionDigits: 6 })}% / 100%`,
          ],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-3 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <p
        className={`mt-3 text-sm ${scoring.weightsValid ? "text-emerald-700" : "text-amber-700"}`}
      >
        {scoring.weightsValid
          ? "Active criteria weights total 100%."
          : "Active competencies and KPIs must share a combined 100% weight before activation."}{" "}
        Inactive items are excluded. This summary includes both tabs and all
        search results.
      </p>
    </section>
  );
}

export default function CriteriaTable({
  kind,
  items,
  disabled,
  filtered,
  onEdit,
  onDeactivate,
}: {
  kind: CriteriaKind;
  items: Criterion[];
  disabled: boolean;
  filtered: boolean;
  onEdit: (item: Criterion) => void;
  onDeactivate: (item: Criterion) => void;
}) {
  if (!items.length)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="font-semibold">
          No {kind === "competencies" ? "competencies" : "KPIs"} found
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          {filtered
            ? "Try another search or status filter."
            : `Add your first ${kind === "competencies" ? "competency" : "KPI"} to this framework.`}
        </p>
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {[
              "Name & description",
              ...(kind === "competencies"
                ? ["Category"]
                : ["Measurement unit", "Target", "Target period"]),
              "Weight",
              "Status",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="whitespace-nowrap px-5 py-4 font-semibold"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item._id}>
              <td className="min-w-56 px-5 py-4">
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 max-w-sm whitespace-pre-wrap break-words text-xs text-slate-500">
                  {item.description || "No description"}
                </p>
              </td>
              {"category" in item ? (
                <td className="px-5 py-4 capitalize">{item.category}</td>
              ) : (
                <>
                  <td className="px-5 py-4">{item.measurementUnit}</td>
                  <td className="px-5 py-4">{item.targetValue}</td>
                  <td className="px-5 py-4">
                    {item.targetPeriod || "Not set"}
                  </td>
                </>
              )}
              <td className="px-5 py-4">{item.weight}%</td>
              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {item.status === "active" ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-4">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Edit ${item.name}`}
                    title="Edit"
                    className="rounded-lg p-2 text-blue-700 enabled:hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => onEdit(item)}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                      <path d="m13.5 6.5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" />
                    </svg>
                  </button>
                  {item.status === "active" && (
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`Deactivate ${item.name}`}
                      title="Deactivate"
                      className="rounded-lg p-2 text-red-700 enabled:hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => onDeactivate(item)}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                        <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
