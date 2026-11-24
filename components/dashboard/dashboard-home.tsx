"use client";

import Link from "next/link";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getAssignedReviewCycles } from "@/services/review-cycle.service";
import { employeeWorkspace } from "./workspaces";

const tones = [
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-violet-50 text-violet-700",
  "bg-amber-50 text-amber-700",
];

const loadReviews = (signal: AbortSignal) => getAssignedReviewCycles(1, signal);

export default function DashboardHome() {
  const { data, loading, error, reload } = useOrganizationResource(loadReviews);

  return (
    <main>
      <header className="flex flex-col items-start gap-6 rounded-2xl bg-linear-to-br from-blue-700 to-blue-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{employeeWorkspace.title}</h1>
          <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">{employeeWorkspace.description}</p>
        </div>
        <Link href="/employee/profile" className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          View my profile
        </Link>
      </header>

      <section aria-labelledby="workspace-areas" className="mt-8">
        <h2 id="workspace-areas" className="text-lg font-bold text-slate-900">My workspace</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {employeeWorkspace.areas.map((area, index) => (
            <li key={area.title}>
              <Link href={area.href} className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`rounded-lg px-2.5 py-1 text-sm font-bold ${tones[index]}`}>{area.title}</h3>
                  <span aria-hidden="true" className="text-sm text-slate-400 group-hover:text-blue-700">↗</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{area.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dashboard-assigned-reviews" className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="dashboard-assigned-reviews" className="text-lg font-bold text-slate-900">Assigned reviews</h2>
          <Link href="/employee/reviews" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            View all reviews
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading && <p role="status" className="p-5 text-sm text-slate-600">Loading assigned reviews…</p>}
          {error && <p role="alert" className="p-5 text-sm text-red-700">Unable to load assigned reviews. <button type="button" className="font-semibold underline" onClick={reload}>Try again</button></p>}
          {data && !loading && !error && (data.cycles.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-800">
                  <tr>
                    <th scope="col" className="px-5 py-3">Review cycle</th>
                    <th scope="col" className="px-5 py-3">Review period (UTC)</th>
                    <th scope="col" className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.cycles.slice(0, 3).map((cycle) => (
                    <tr key={cycle._id}>
                      <th scope="row" className="px-5 py-4 font-semibold text-slate-800">{cycle.name}</th>
                      <td className="px-5 py-4 text-slate-600">{cycle.startDate.slice(0, 10)} to {cycle.endDate.slice(0, 10)}</td>
                      <td className="px-5 py-4">
                        <Link href={`/employee/reviews?cycleId=${encodeURIComponent(cycle._id)}`} aria-label={`Open review for ${cycle.name}`} className="font-semibold text-blue-700 hover:underline">Open review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="p-5 text-sm text-slate-600">You have no published reviews assigned to you.</p>)}
        </div>
      </section>
    </main>
  );
}
