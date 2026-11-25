"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardWelcome from "@/components/dashboard/dashboard-welcome";
import { getCurrentUser, getToken } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { getEmployees } from "@/services/employee.service";
import type { Employee } from "@/types/employee";

const moduleShortcuts = [
  { icon: "♙", title: "Employee & Structure", href: "/hr/organization", description: "Manage departments, teams, and reporting relationships." },
  { icon: "▤", title: "Review Templates", href: "/hr/performance-framework/templates", description: "Configure review sections, questions, and evaluation criteria." },
  { icon: "⟳", title: "Review Cycles", href: "/hr/review-cycles", description: "Plan review cycles, schedules, and milestones." },
  { icon: "∿", title: "Review Monitoring", href: "/hr/review-cycles", description: "Open the review-cycle workspace for submission tracking." },
  { icon: "☆", title: "Score & 360° Feedback", href: "/hr/normalisation", description: "Open normalisation to align performance ratings across teams." },
  { icon: "▥", title: "Reports & Analytics", href: "/hr/analytics", description: "Open the workspace for workforce performance reporting." },
  { icon: "↗", title: "Promotion & Development", href: "/hr/promotion-development", description: "Open the workspace for promotion readiness and employee growth." },
  { icon: "◇", title: "Audit & Investigation", href: "/hr/audit", description: "Open the audit workspace for HR actions and system activity." },
];

export default function HrDashboardPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEmployees() {
      try {
        const token = getToken();
        if (!token) throw new Error("Please sign in to view employee data.");

        const records = await getEmployees(token, controller.signal);
        if (!controller.signal.aborted) setEmployees(records);
      } catch (cause) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(cause));
      }
    }

    void loadEmployees();
    return () => controller.abort();
  }, [request]);

  function refreshEmployees() {
    setEmployees(null);
    setError(null);
    setRequest((value) => value + 1);
  }

  const accountEmail = getCurrentUser()?.email.trim().toLowerCase();
  const profile = accountEmail
    ? employees?.find((employee) => employee.workEmail?.trim().toLowerCase() === accountEmail)
    : undefined;
  const hrName = profile?.fullName?.trim()
    || [profile?.firstName?.trim(), profile?.lastName?.trim()].filter(Boolean).join(" ");

  const placeholder = error ? "Unavailable" : "…";
  const summaryCards = [
    {
      label: "Total employees",
      value: employees ? employees.length.toLocaleString() : placeholder,
      detail: "Employee directory",
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending onboarding",
      value: employees
        ? employees.filter((employee) => employee.onboardingStatus === "pending").length.toLocaleString()
        : placeholder,
      detail: "Awaiting activation",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Active review cycles",
      value: "—",
      detail: "Review data not connected yet",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Reviews to normalise",
      value: "—",
      detail: "Review data not connected yet",
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <main>
      <DashboardWelcome
        title="HR Dashboard"
        description="Track onboarding, review cycles, and workforce activity."
        fallbackName={hrName}
        action={{ href: "/hr/onboarding", label: "Onboard an employee" }}
      />

      <section
        aria-label="Dashboard summary"
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className={`mb-4 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${card.tone}`}>
              {card.label}
            </h2>
            <p className="text-3xl font-bold tabular-nums text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      <section aria-labelledby="hr-modules" className="mt-8">
        <h2 id="hr-modules" className="text-lg font-bold text-slate-900">Modules &amp; System Management</h2>
        <p className="mt-1 text-sm text-slate-500">Open HR administration tools and review workflows.</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {moduleShortcuts.map((shortcut) => (
            <li key={shortcut.title}>
              <Link
                href={shortcut.href}
                className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <div aria-hidden="true" className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-xl font-semibold text-blue-700">{shortcut.icon}</span>
                  <span className="text-sm text-slate-400 group-hover:text-blue-700">↗</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{shortcut.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">{shortcut.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>Unable to load employee data: {error}</p>
          <button
            type="button"
            onClick={refreshEmployees}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <section aria-labelledby="dashboard-employee-details" className="mt-6">
        <h2 id="dashboard-employee-details" className="mb-3 text-lg font-bold text-slate-900">
          Employee details
        </h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!employees ? (
            <p role="status" className="py-12 text-center text-sm text-slate-500">
              {error ? "Employee data could not be loaded." : "Loading employee data…"}
            </p>
          ) : employees.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No employees yet. Add an employee to begin onboarding.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-800">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-bold">Employee</th>
                    <th scope="col" className="px-5 py-3 font-bold">Employee number</th>
                    <th scope="col" className="px-5 py-3 font-bold">Onboarding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.slice(0, 3).map((employee) => (
                    <tr key={employee._id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {[employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.workEmail}
                        </p>
                        <p className="mt-1 text-slate-500">{employee.workEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {employee.employeeNumber || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            employee.onboardingStatus === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {employee.onboardingStatus === "completed" ? "Completed" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end border-t border-slate-100 px-5 py-4">
            <Link
              href="/hr/onboarding#employee-details"
              aria-label="See more employee onboarding records"
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              See more
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
