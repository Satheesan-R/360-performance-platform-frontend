"use client";

import { useCallback, useState } from "react";
import { useApprovalNotifications } from "@/components/layout/admin-shell";
import { Field, inputClass, ResourceState, buttonClass, secondaryClass } from "@/components/organization/ui";
import { TemplatePreviewContent } from "@/components/performance-framework/template-preview";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import { templateTargetRoleLabels } from "@/lib/review-template";
import { decideTemplateApproval, getPendingTemplateApprovals, getReviewTemplates, getTemplatePreview } from "@/services/review-template.service";
import type { TemplateListItem } from "@/types/review-template";

const views = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
} as const;
type ApprovalView = keyof typeof views;
const approvalViews: ApprovalView[] = ["pending", "approved", "rejected"];

function ApprovalDetails({
  item, onBack, onDecided,
}: {
  item: TemplateListItem;
  onBack: () => void;
  onDecided: (message: string) => void;
}) {
  const load = useCallback((signal: AbortSignal) => getTemplatePreview(item._id, signal), [item._id]);
  const preview = useOrganizationResource(load);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const status = preview.data?.approvalStatus ?? item.approvalStatus;
  const pending = status === "pending";

  async function decide(decision: "approve" | "reject") {
    if (busy || !pending || preview.loading || preview.error) return;
    setBusy(true);
    setError("");
    try {
      await decideTemplateApproval(item._id, decision, comment.trim());
      onDecided(`${item.name} was ${decision === "approve" ? "approved" : "declined"}.`);
    } catch (error) {
      setError(getApiErrorMessage(error));
      void preview.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6">
      <button type="button" className={secondaryClass} onClick={onBack} disabled={busy}>← Back to approval queue</button>
      <dl className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="font-semibold">Approval status</dt><dd>{status && status !== "not_submitted" ? views[status] : "Not submitted"}</dd></div>
        <div><dt className="font-semibold">Review type</dt><dd className="capitalize">{item.reviewType ?? "Unspecified"}</dd></div>
        <div><dt className="font-semibold">Target role</dt><dd>{item.targetRole ? templateTargetRoleLabels[item.targetRole] : "Not configured"}</dd></div>
        <div><dt className="font-semibold">Departments</dt><dd>{item.departmentIds?.map((department) => department.name).join(", ") || "All eligible departments"}</dd></div>
        <div><dt className="font-semibold">Employment types</dt><dd>{item.employmentTypeIds.map((type) => type.name).join(", ") || "Inherited from framework"}</dd></div>
        <div><dt className="font-semibold">Submitted</dt><dd>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}</dd></div>
        {status === "approved" && item.approvedAt && (
          <div><dt className="font-semibold">Approved on</dt><dd>{new Date(item.approvedAt).toLocaleString()}</dd></div>
        )}
        {item.approvalComment && <div><dt className="font-semibold">{pending ? "Submission note" : "Decision note"}</dt><dd className="whitespace-pre-wrap break-words">{item.approvalComment}</dd></div>}
      </dl>
      <ResourceState loading={preview.loading} error={preview.error} retry={preview.reload} />
      {preview.data && !preview.loading && !preview.error && (
        <>
          <TemplatePreviewContent preview={preview.data} />
          {pending ? (
            <fieldset disabled={busy} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <Field label="Decision note (optional)">
                <textarea className={inputClass} maxLength={1000} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
              </Field>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className={buttonClass} disabled={!preview.data.validation.ready} onClick={() => void decide("approve")}>Approve</button>
                <button type="button" className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => void decide("reject")}>Decline</button>
              </div>
            </fieldset>
          ) : null}
        </>
      )}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    </section>
  );
}

export default function TemplateApprovals() {
  const [view, setView] = useState<ApprovalView>("pending");

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Template Approvals</h1>
      <p className="mt-2 text-sm text-slate-600">Review templates submitted by HR and see their approval decisions.</p>
      <div role="group" aria-label="Filter by approval status" className="mt-5 flex flex-wrap gap-2 border-b border-slate-200">
        {approvalViews.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={view === status}
            onClick={() => setView(status)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${view === status ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:text-blue-700"}`}
          >
            {views[status]}
          </button>
        ))}
      </div>
      <ApprovalRequests key={view} view={view} />
    </>
  );
}

function ApprovalRequests({ view }: { view: ApprovalView }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TemplateListItem | null>(null);
  const [message, setMessage] = useState("");
  const load = useCallback((signal: AbortSignal) => view === "pending"
    ? getPendingTemplateApprovals(page, signal)
    : getReviewTemplates({ search: "", frameworkId: "", status: "", approvalStatus: view, page }, signal), [page, view]);
  const queue = useOrganizationResource(load);
  const refreshBadge = useApprovalNotifications(queue.reload);
  const data = queue.data;

  function refresh() {
    void queue.reload();
    refreshBadge();
  }

  return (
    <>
      {!selected && <div className="mt-5 flex justify-end"><button type="button" className={secondaryClass} disabled={queue.loading} onClick={refresh}>Refresh requests</button></div>}
      {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      {selected ? (
        <ApprovalDetails
          key={selected._id}
          item={selected}
          onBack={() => { setSelected(null); refresh(); }}
          onDecided={(message) => {
            setMessage(message);
            setSelected(null);
            refresh();
          }}
        />
      ) : (
        <div className="mt-6">
          <ResourceState loading={queue.loading || Boolean(data && data.pagination.page !== page && !queue.error)} error={queue.error} retry={refresh} />
          {data && data.pagination.page === page && !queue.loading && !queue.error && (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <caption className="px-4 py-4 text-left font-semibold">{data.pagination.total} {views[view].toLowerCase()} templates</caption>
                  <thead className="bg-slate-100">
                    <tr>{["Template", "Framework", view === "approved" ? "Approved on" : "Submitted", "Action"].map((column) => <th scope="col" key={column} className="px-4 py-3">{column}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.templates.map((item) => {
                      const date = view === "approved" ? item.approvedAt : item.submittedAt;
                      return (
                        <tr key={item._id}>
                          <td className="px-4 py-4 font-semibold">{item.name}</td>
                          <td className="px-4 py-4">{item.frameworkId?.name ?? "—"}</td>
                          <td className="px-4 py-4">{date ? new Date(date).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              className="font-semibold text-blue-700 hover:underline"
                              aria-label={`${view === "pending" ? "Review" : "View"} ${item.name}`}
                              onClick={() => { setMessage(""); setSelected(item); }}
                            >
                              {view === "pending" ? "Review" : "View details"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!data.templates.length && <tr><td colSpan={4} className="p-5 text-slate-600">No {views[view].toLowerCase()} templates on this page.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className={secondaryClass} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <button type="button" className={secondaryClass} disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
