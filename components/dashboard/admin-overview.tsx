"use client";

import Link from "next/link";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { ResourceState } from "@/components/organization/ui";
import { getOrganizationSummary } from "@/services/organization.service";
import { getReviewTemplates } from "@/services/review-template.service";
import AdminPageHeading from "./admin-page-heading";

function loadTemplates(signal: AbortSignal) {
  return getReviewTemplates({ page: 1, search: "", status: "", frameworkId: "" }, signal);
}

const destinations = [
  { title: "Review templates", href: "/admin/review-templates", detail: "Browse templates, frameworks, and publication statuses." },
  { title: "Organization", href: "/admin/organization", detail: "View company details and update organization settings." },
  { title: "Employee directory", href: "/admin/employees", detail: "Find employee records and check onboarding status." },
];

export default function AdminOverview() {
  const organization = useOrganizationResource(getOrganizationSummary);
  const templates = useOrganizationResource(loadTemplates);
  const metrics = [
    { label: "Employees", value: organization.data?.totalEmployees, href: "/admin/employees", tone: "bg-blue-50 text-blue-700", resource: organization },
    { label: "Departments", value: organization.data?.departments, href: "/admin/organization", tone: "bg-emerald-50 text-emerald-700", resource: organization },
    { label: "Teams", value: organization.data?.teams, href: "/admin/organization", tone: "bg-violet-50 text-violet-700", resource: organization },
    { label: "Review templates", value: templates.data?.pagination.total, href: "/admin/review-templates", tone: "bg-amber-50 text-amber-700", resource: templates },
  ];

  return (
    <main className="mx-auto max-w-7xl">
      <AdminPageHeading title="Admin Dashboard" description="Monitor your organization and open the tools you use to administer the platform." />

      <section aria-label="Platform summary" className="mt-7">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, href, tone, resource }) => (
            <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${tone}`}>{label}</span>
              <span className="mt-4 block text-2xl font-bold tracking-tight text-slate-950">
                {resource.loading ? "Loading..." : resource.error ? "Unavailable" : value?.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
        {organization.error && (
          <div className="mt-4">
            <ResourceState loading={false} error={organization.error} retry={organization.reload} />
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section aria-labelledby="recent-templates" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="recent-templates" className="text-lg font-bold text-slate-950">Recent review templates</h2>
            <Link href="/admin/review-templates" className="text-sm font-semibold text-blue-700 hover:underline">View all templates</Link>
          </div>
          <div className="mt-4">
            {templates.loading ? (
              <p role="status" className="py-6 text-sm text-slate-600">Loading review templates...</p>
            ) : templates.error ? (
              <ResourceState loading={false} error={templates.error} retry={templates.reload} />
            ) : templates.data?.templates.length ? (
              <ul className="divide-y divide-slate-100">
                {templates.data.templates.slice(0, 5).map((template) => (
                  <li key={template._id} className="flex items-start justify-between gap-3 py-4">
                    <div className="min-w-0 break-words">
                      <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{template.frameworkId?.name ?? "Framework unavailable"}</p>
                    </div>
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">{template.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-sm text-slate-600">No review templates are available yet.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="admin-quick-actions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 id="admin-quick-actions" className="text-lg font-bold text-slate-950">Quick actions</h2>
          <ul className="mt-4 space-y-3">
            {destinations.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                  <span className="block text-sm font-semibold text-blue-700">{item.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{item.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
