"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { getEmployees } from "@/services/employee.service";
import type { Employee } from "@/types/employee";

const quickActions = [
  { href: "/hr/onboarding", title: "Onboard an employee", description: "Create a profile and send activation mail." },
  { href: "/hr/review-cycles", title: "Create review cycle", description: "Prepare the next performance review." },
  { href: "/hr/analytics", title: "View analytics", description: "Explore workforce performance trends." },
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
    <main className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            HR Dashboard
          </h1>
          <p className="mt-2 text-slate-500">
            Track onboarding, review cycles, and workforce activity.
          </p>
        </div>
        
      </div>

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

      <section
        aria-label="Dashboard summary"
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className={`mb-5 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${card.tone}`}>
              {card.label}
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Employee onboarding</h2>
              <p className="mt-1 text-sm text-slate-500">
                The five most recently added employees.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshEmployees}
              disabled={!employees && !error}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              Refresh employee data
            </button>
          </div>

          {!employees ? (
            <p role="status" className="py-12 text-center text-sm text-slate-500">
              {error ? "Employee data could not be loaded." : "Loading employee data…"}
            </p>
          ) : employees.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No employees yet. Add an employee to begin onboarding.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-medium">Employee</th>
                    <th scope="col" className="px-3 py-3 font-medium">Employee number</th>
                    <th scope="col" className="px-3 py-3 font-medium">Onboarding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.slice(0, 5).map((employee) => (
                    <tr key={employee._id}>
                      <td className="px-3 py-4">
                        <p className="font-semibold text-slate-800">
                          {[employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.workEmail}
                        </p>
                        <p className="mt-1 text-slate-500">{employee.workEmail}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {employee.employeeNumber || "—"}
                      </td>
                      <td className="px-3 py-4">
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
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          <div className="mt-5 space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-xl border border-slate-200 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="font-semibold text-slate-800">{action.title}</p>
                <p className="mt-1 text-sm text-slate-500">{action.description}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
