"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ResourceState, secondaryClass } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { reviewerRoleLabels } from "@/lib/reviewer-assignments";
import { getAssignedReview, getAssignedReviewCycles } from "@/services/review-cycle.service";
import AssignedReviewForm from "./assigned-review-form";
import { ResourceState, secondaryClass } from "@/components/organization/ui";
import ReviewFormPreview from "@/components/performance-framework/review-form-preview";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { reviewerRoleLabels } from "@/lib/reviewer-assignments";
import { getAssignedReview, getAssignedReviewCycles } from "@/services/review-cycle.service";

function ReviewDetails({ id, onBack }: { id: string; onBack: () => void }) {
  const load = useCallback((signal: AbortSignal) => getAssignedReview(id, signal), [id]);
  const { data, loading, error, reload } = useOrganizationResource(load);
  const [selected, setSelected] = useState("");
  const assignment = data?.assignments.find((item) => item.employeeId === selected) ?? data?.assignments[0];
  const description = data?.description?.trim();
  const showDescription = description && data &&
    description.toLowerCase() !== data.templateName.trim().toLowerCase() &&
    description.toLowerCase() !== data.name.trim().toLowerCase();
  return (
    <>
      <button type="button" className={`${secondaryClass} mb-5`} onClick={onBack}>← Back to assigned reviews</button>
      <ResourceState loading={loading} error={error} retry={reload} />
      {data && !loading && !error && assignment && (
        <>
          <h2 className="text-xl font-bold">{data.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{data.templateName}</p>
          {showDescription && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{description}</p>}
          {data.assignments.length > 1 ? (
            <label className="mt-4 block text-sm font-semibold">
              Review assignment
              <select className="mt-2 block max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={assignment.employeeId} onChange={(event) => setSelected(event.target.value)}>
                {data.assignments.map((item) => <option key={item.employeeId} value={item.employeeId}>{item.participantName || "Participant"} · {reviewerRoleLabels[item.role]}</option>)}
              </select>
            </label>
          ) : (
            <p className="mt-4 text-sm font-semibold">{assignment.participantName || "Participant"} · {reviewerRoleLabels[assignment.role]}</p>
          )}
          <AssignedReviewForm key={assignment.employeeId} cycleId={id} participantId={assignment.employeeId} review={data} />
          <ReviewFormPreview key={assignment.employeeId} sections={data.sections} scale={data.ratingScale} readOnly />
        </>
      )}
    </>
  );
}

function ReviewList({ page, onPage, onOpen }: { page: number; onPage: (page: number) => void; onOpen: (id: string) => void }) {
  const load = useCallback((signal: AbortSignal) => getAssignedReviewCycles(page, signal), [page]);
  const { data, loading, error, reload } = useOrganizationResource(load);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" className={secondaryClass} disabled={loading} onClick={reload}>Refresh reviews</button>
      </div>
      <ResourceState loading={loading} error={error} retry={reload} />
      {data && !loading && !error && (
        <>
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {data.cycles.map((cycle) => (
              <li key={cycle._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{cycle.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{cycle.startDate.slice(0, 10)} to {cycle.endDate.slice(0, 10)} (UTC)</p>
                </div>
                <button type="button" className={secondaryClass} aria-label={`Open review form for ${cycle.name}`} onClick={() => onOpen(cycle._id)}>Open review form</button>
              </li>
            ))}
            {!data.cycles.length && <li className="p-5 text-sm text-slate-600">You have no published reviews assigned to you.</li>}
          </ul>
          {data.pagination.totalPages > 1 && (
            <div className="mt-4 flex gap-2">
              <button type="button" className={secondaryClass} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
              <button type="button" className={secondaryClass} disabled={page >= data.pagination.totalPages} onClick={() => onPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function AssignedReviews({
  title = "My Reviews", initialCycleId = "", fullWidth = false,
}: { title?: string; initialCycleId?: string; fullWidth?: boolean }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(initialCycleId);
  const pathname = usePathname();
  const router = useRouter();

  function back() {
    setSelected("");
    if (initialCycleId) router.replace(pathname);
  }
export default function AssignedReviews({ title = "My Reviews" }: { title?: string }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState("");
  return (
    <div className={fullWidth ? undefined : "mx-auto max-w-5xl"}>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{title}</h1>
      {selected
        ? <ReviewDetails key={selected} id={selected} onBack={back} />
        ? <ReviewDetails key={selected} id={selected} onBack={() => setSelected("")} />
        : <ReviewList key={page} page={page} onPage={setPage} onOpen={setSelected} />}
    </div>
  );
}
