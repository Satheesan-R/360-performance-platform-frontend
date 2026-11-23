"use client";

import { useCallback } from "react";
import { ResourceState, secondaryClass } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getReviewCycleResults } from "@/services/review-cycle.service";

const scoreFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export default function CycleResults({ id, onBack }: { id: string; onBack: () => void }) {
  const load = useCallback((signal: AbortSignal) => getReviewCycleResults(id, signal), [id]);
  const { data, loading, error, reload } = useOrganizationResource(load);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button type="button" className={secondaryClass} onClick={onBack}>← Back to cycles</button>
        <button type="button" className={secondaryClass} disabled={loading} onClick={reload}>Refresh results</button>
      </div>
      <h2 className="text-xl font-bold">{data?.name ?? "Cycle results"}</h2>
      <ResourceState loading={loading} error={error} retry={reload} />
      {data && !loading && !error && (
        <div className="mt-4 overflow-x-auto">
          <table aria-label="Participant review results" className="w-full text-left text-sm">
            <thead className="border-b border-slate-200">
              <tr>{["Participant", "Reviews submitted", "Final rating", "Normalized score"].map((label) => <th key={label} scope="col" className="p-3">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.participants.map((person) => (
                <tr key={person.employeeId}>
                  <th scope="row" className="p-3 font-medium">{person.name || "Participant"}</th>
                  <td className="p-3">{person.submitted} of {person.assigned}</td>
                  <td className="p-3">{person.score == null ? "Awaiting submissions" : `${scoreFormat.format(person.score)} / ${data.maxRating}`}</td>
                  <td className="p-3">{person.normalizedPercent == null ? "—" : `${scoreFormat.format(person.normalizedPercent)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
