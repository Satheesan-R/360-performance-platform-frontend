"use client";

import { useState } from "react";
import { Field, ResourceState, inputClass, secondaryClass } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getToken } from "@/lib/auth";
import { getEmployees } from "@/services/employee.service";

const pageSize = 15;

function loadEmployees(signal: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Please sign in to view employees.");
  return getEmployees(token, signal);
}

export default function AdminEmployees() {
  const { data, loading, error, reload } = useOrganizationResource(loadEmployees);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const search = query.trim().toLowerCase();
  const employees = (data ?? []).filter((employee) =>
    [`${employee.firstName ?? ""} ${employee.lastName ?? ""}`, employee.workEmail, employee.employeeNumber]
      .some((value) => value?.toLowerCase().includes(search)),
  );
  const totalPages = Math.max(1, Math.ceil(employees.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleEmployees = employees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="mt-7">
      {loading ? (
        <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading employees...</p>
      ) : error ? (
        <ResourceState loading={false} error={error} retry={reload} />
      ) : (
        <section aria-label="Employee records" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="max-w-sm">
              <Field label="Search employees">
                <input type="search" className={inputClass} placeholder="Name, employee number, or work email" value={query} onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }} />
              </Field>
            </div>
            <p role="status" className="mt-3 text-sm text-slate-600">{employees.length.toLocaleString()} {employees.length === 1 ? "employee" : "employees"}</p>
          </div>

          {visibleEmployees.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    {["Employee", "Employee number", "Job title", "Onboarding"].map((label) => (
                      <th key={label} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleEmployees.map((employee) => (
                    <tr key={employee._id}>
                      <th scope="row" className="px-5 py-4 font-semibold text-slate-900">
                        {[employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.workEmail}
                        <span className="mt-1 block font-normal text-slate-500">{employee.workEmail}</span>
                      </th>
                      <td className="px-5 py-4 text-slate-600">{employee.employeeNumber || "Unavailable"}</td>
                      <td className="px-5 py-4 text-slate-600">{employee.jobTitle || employee.designation || "Unavailable"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${employee.onboardingStatus === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {employee.onboardingStatus || "Unavailable"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="px-6 pb-6 text-sm text-slate-600">{search ? "No employees match your search." : "No employee records are available."}</p>}

          {totalPages > 1 && (
            <nav aria-label="Employee directory pages" className="flex flex-wrap items-center gap-3 border-t border-slate-200 p-5 text-sm">
              <button type="button" className={secondaryClass} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
              <span className="text-slate-600">Page {currentPage} of {totalPages}</span>
              <button type="button" className={secondaryClass} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
