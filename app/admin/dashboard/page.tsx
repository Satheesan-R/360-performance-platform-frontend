"use client";

import Link from "next/link";
import { useApprovalNotifications } from "@/components/layout/template-approval-notifications";
import { buttonClass } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getPendingTemplateApprovals, getReviewTemplates } from "@/services/review-template.service";

const approvalsPath = "/admin/template-approvals";

async function loadDashboard(signal: AbortSignal) {
  const filters = { search: "", frameworkId: "", status: "", page: 1 };
  const [pending, approved, declined] = await Promise.all([
    getPendingTemplateApprovals(1, signal),
    getReviewTemplates({ ...filters, approvalStatus: "approved" }, signal),
    getReviewTemplates({ ...filters, approvalStatus: "rejected" }, signal),
  ]);
  return {
    pending: pending.pagination.total,
    approved: approved.pagination.total,
    declined: declined.pagination.total,
    requests: pending.templates.slice(0, 5),
  };
}

export default function AdminDashboardPage() {
  const { data, loading, error, reload } = useOrganizationResource(loadDashboard);
  const refreshBadge = useApprovalNotifications(reload);
  const summaryCards = [
    { label: "Pending approval", value: data?.pending, detail: "Waiting for an admin decision", tone: "bg-amber-50 text-amber-700" },
    { label: "Approved templates", value: data?.approved, detail: "Approved by Admin", tone: "bg-emerald-50 text-emerald-700" },
    { label: "Declined templates", value: data?.declined, detail: "Declined by Admin", tone: "bg-rose-50 text-rose-700" },
  ];

  function refresh() {
    void reload();
    refreshBadge();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-500">Track review templates submitted by HR and their approval status.</p>
        </div>
        <Link href={approvalsPath} className={`${buttonClass} inline-flex justify-center`}>Open approval queue</Link>
      </header>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load template approvals. {error}
        </p>
      )}

      <section aria-label="Dashboard summary" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className={`mb-5 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${card.tone}`}>{card.label}</h2>
            <p className="text-3xl font-bold text-slate-900">{error ? "Unavailable" : card.value?.toLocaleString() ?? "…"}</p>
            <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pending template requests</h2>
              <p className="mt-1 text-sm text-slate-500">Up to five templates awaiting your decision.</p>
            </div>
            <button type="button" disabled={loading} onClick={refresh} className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50">
              Refresh requests
            </button>
          </div>
          {loading && <p role="status" className="py-12 text-center text-sm text-slate-500">Loading template requests…</p>}
          {!loading && !error && data && (
            data.requests.length ? (
              <div className="mt-6 overflow-x-auto">
                <table aria-label="Pending template requests" className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th scope="col" className="px-3 py-3 font-medium">Template</th>
                      <th scope="col" className="px-3 py-3 font-medium">Framework</th>
                      <th scope="col" className="px-3 py-3 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.requests.map((request) => (
                      <tr key={request._id}>
                        <td className="px-3 py-4 font-semibold text-slate-800">{request.name}</td>
                        <td className="px-3 py-4 text-slate-600">{request.frameworkId?.name ?? "—"}</td>
                        <td className="px-3 py-4 text-slate-600">{request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="py-12 text-center text-sm text-slate-500">No templates are awaiting approval.</p>
          )}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          <Link href={approvalsPath} className="mt-5 block rounded-xl border border-slate-200 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50">
            <p className="font-semibold text-slate-800">Review pending templates</p>
            <p className="mt-1 text-sm text-slate-500">Open a request to review its criteria and make a decision.</p>
          </Link>
        </article>
      </section>
    </div>
  );
}

