"use client";

import Link from "next/link";
import { useState } from "react";
import type { DepartmentOption } from "@/services/department.service";
import type { UserRole } from "@/types/auth";
import type { Employee } from "@/types/employee";

const pageSize = 5;
const roleLabels: Record<UserRole, string> = {
  employee: "Employee",
  tech_lead: "Tech Lead",
  department_manager: "Department Manager",
  hr: "HR",
  admin: "Admin",
};
const emptyFilters = { department: "", position: "", status: "", manager: "" };
const filterLabels = { department: "Department", position: "Position", status: "Status", manager: "Manager" } as const;
const filterKeys = Object.keys(filterLabels) as (keyof typeof filterLabels)[];
const columns = ["Employee name", "ID", "Department", "Position", "Manager", "Status", "Actions"];
const pageButton = "rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40";

function employeeName(employee: { firstName?: string; lastName?: string; fullName?: string }) {
  return employee.fullName?.trim() || [employee.firstName, employee.lastName].filter(Boolean).join(" ");
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export default function OnboardingDirectory({
  employees,
  departments,
  loading,
  error,
  departmentsLoading,
  departmentError,
  onRetry,
}: {
  employees: Employee[];
  departments: DepartmentOption[];
  loading: boolean;
  error: string;
  departmentsLoading: boolean;
  departmentError: string;
  onRetry: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  const departmentNames = new Map(departments.map(({ _id, name }) => [_id, name]));
  const employeesById = new Map(employees.map((employee) => [employee._id, employee]));
  const rows = employees.map((employee) => {
    const department = typeof employee.departmentId === "object"
      ? employee.departmentId?.name
      : employee.departmentId && departmentNames.get(employee.departmentId);
    const manager = typeof employee.managerId === "object"
      ? employee.managerId
      : employeesById.get(employee.managerId ?? "");
    return {
      id: employee._id,
      name: employeeName(employee) || employee.workEmail || employee.companyEmail || "Unnamed employee",
      email: employee.workEmail || employee.companyEmail,
      number: employee.employeeNumber,
      department: department || employee.department || (employee.departmentId ? "Department unavailable" : "Unassigned"),
      position: employee.jobTitle || employee.designation || "Unassigned",
      role: employee.user?.role ? roleLabels[employee.user.role] : undefined,
      manager: (manager && employeeName(manager)) || employee.reportingManager || (employee.managerId ? "Manager unavailable" : "Unassigned"),
      status: employee.user?.status === "disabled" ? "Disabled" : employee.onboardingStatus === "completed" ? "Active" : "Pending",
    };
  });

  const query = search.trim().toLowerCase();
  const matching = rows.filter((row) =>
    filterKeys.every((key) => !filters[key] || row[key] === filters[key])
    && (!query || [row.name, row.email, row.number, row.department, row.position, row.role, row.manager, row.status]
      .some((value) => value?.toLowerCase().includes(query))),
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const visibleRows = matching.slice(offset, offset + pageSize);
  const month = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit" })
    .formatToParts(new Date());
  const monthKey = `${month.find((part) => part.type === "year")?.value}-${month.find((part) => part.type === "month")?.value}`;
  const hires = employees.filter((employee) => (employee.JoiningDate || employee.contractStartDate)?.slice(0, 7) === monthKey).length;
  const stats = [
    { label: "Total staff", value: employees.length, loading, error, tone: "bg-blue-100 text-blue-700", icon: "♙" },
    { label: "New hires this month", value: hires, loading, error, tone: "bg-emerald-100 text-emerald-700", icon: "+" },
    { label: "Active departments", value: departments.length, loading: departmentsLoading, error: departmentError, tone: "bg-slate-100 text-slate-700", icon: "◇" },
  ];

  return (
    <div className="mt-6 space-y-5">
      <dl aria-label="Employee statistics" className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${stat.tone}`}>{stat.icon}</span>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-600">{stat.label}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                {stat.loading ? "Loading…" : stat.error ? "Unavailable" : stat.value.toLocaleString()}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <section id="employee-details" aria-label="Employee details" className="scroll-mt-24 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="search"
            aria-label="Search employees"
            placeholder="Search by name, ID, department, or keywords…"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-600">Filters</span>
            {filterKeys.map((key) => (
              <select
                key={key}
                aria-label={filterLabels[key]}
                value={filters[key]}
                onChange={(event) => { setFilters({ ...filters, [key]: event.target.value }); setPage(1); }}
                className="max-w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <option value="">{filterLabels[key]}</option>
                {[...new Set(rows.map((row) => row[key]))].sort((a, b) => a.localeCompare(b)).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            ))}
            <button type="button" onClick={() => { setSearch(""); setFilters(emptyFilters); setPage(1); }} className="ml-auto rounded-lg px-2 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              Reset filters
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p role="status" className="p-8 text-center text-sm text-slate-600">Loading employees…</p>
          ) : error ? (
            <div className="p-8 text-center text-sm">
              <p role="alert" className="text-red-700">{error}</p>
              <button type="button" onClick={onRetry} className="mt-3 font-semibold text-blue-700 hover:underline">Try again</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-blue-50 text-slate-700">
                    <tr>
                      {columns.map((column) => (
                        <th key={column} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleRows.map((row) => (
                      <tr key={row.id} className="text-slate-700 hover:bg-slate-50">
                        <th scope="row" className="px-4 py-4 text-left font-normal">
                          <div className="flex items-center gap-3">
                            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{initials(row.name)}</span>
                            <div>
                              <p className="font-semibold text-slate-900">{row.name}</p>
                              {row.email && <p className="mt-0.5 text-xs text-slate-500">{row.email}</p>}
                            </div>
                          </div>
                        </th>
                        <td className="whitespace-nowrap px-4 py-4 tabular-nums">{row.number || "—"}</td>
                        <td className="px-4 py-4">{row.department}</td>
                        <td className="px-4 py-4">
                          {row.position}
                          {row.role && <p className="mt-0.5 text-xs text-slate-500">{row.role}</p>}
                        </td>
                        <td className="px-4 py-4">{row.manager}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === "Active" ? "bg-emerald-50 text-emerald-800" : row.status === "Pending" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{row.status}</span>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/hr/onboarding/${encodeURIComponent(row.id)}`}
                            aria-label={`View details for ${row.name}`}
                            className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!visibleRows.length && (
                      <tr>
                        <td colSpan={columns.length} className="p-8 text-center text-slate-600">
                          {employees.length ? "No employees match your search and filters." : "No employees yet. Select Add Employee to get started."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                <p role="status" className="text-sm text-slate-600">
                  {matching.length
                    ? `Showing ${offset + 1}–${offset + visibleRows.length} of ${matching.length.toLocaleString()} employees`
                    : "Showing 0 employees"}
                </p>
                {totalPages > 1 && (
                  <nav aria-label="Employee directory pages" className="flex items-center gap-2">
                    <button type="button" className={pageButton} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
                    <span className="px-1 text-sm tabular-nums text-slate-600">{currentPage} / {totalPages}</span>
                    <button type="button" className={pageButton} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
                  </nav>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
