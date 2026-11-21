"use client";

import Link from "next/link";
import { useCallback, type ReactNode } from "react";
import { ResourceState } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getToken } from "@/lib/auth";
import { getEmployee } from "@/services/employee.service";
import { getHierarchy } from "@/services/organization.service";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

function formatDate(value?: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : dateFormat.format(date);
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">{value || "Unavailable"}</dd>
    </div>
  );
}

export default function EmployeeDetails({ id }: { id: string }) {
  const loadEmployee = useCallback((signal: AbortSignal) => {
    const token = getToken();
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    return getEmployee(id, token, signal);
  }, [id]);

  const employee = useOrganizationResource(loadEmployee);
  const hierarchy = useOrganizationResource(getHierarchy);
  const record = employee.data;
  const name = record?.fullName?.trim()
    || [record?.firstName, record?.lastName].filter(Boolean).join(" ")
    || record?.workEmail
    || "Employee details";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();

  const department = typeof record?.departmentId === "object" ? record.departmentId?.name : record?.department;
  const team = typeof record?.teamId === "object" ? record.teamId?.name : undefined;
  const manager = typeof record?.managerId === "object" ? record.managerId : null;
  const managerName = [manager?.firstName, manager?.lastName].filter(Boolean).join(" ")
    || record?.reportingManager
    || hierarchy.data?.find((person) => person._id === record?.managerId)?.fullName;
  const directReports = hierarchy.data?.filter((person) => person.reportingManagerId === id) ?? [];
  const position = record?.jobTitle || record?.designation;
  const employmentType = (typeof record?.employmentTypeId === "object" ? record.employmentTypeId?.name : undefined)
    || (record?.employmentType && { "full-time": "Full-time", probation: "Probation", intern: "Internship" }[record.employmentType]);
  const startDate = record?.JoiningDate || record?.contractStartDate;
  const email = record?.workEmail || record?.companyEmail;

  return (
    <main>
      <Link href="/hr/onboarding#employee-details" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
        <span aria-hidden="true">←</span> Back to employees
      </Link>

      {employee.loading || employee.error || !record ? (
        <section className="mt-4 space-y-4">
          <h1 className="text-3xl font-bold text-slate-950">Employee details</h1>
          {employee.loading
            ? <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading employee details…</p>
            : <ResourceState loading={false} error={employee.error || "Employee details are unavailable."} retry={employee.reload} />}
        </section>
      ) : (
        <>
          <header className="mt-4 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <span aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-800">{initials}</span>
            <div className="min-w-0">
              <h1 className="wrap-break-word text-3xl font-bold tracking-tight text-slate-950">{name}</h1>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                {record.employeeNumber && <li className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">ID {record.employeeNumber}</li>}
                {position && <li className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{position}</li>}
                {department && <li className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{department}</li>}
              </ul>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                {email && <a href={`mailto:${email}`} className="break-all hover:text-blue-700 hover:underline">{email}</a>}
                {record.officeLocation && <span>{record.officeLocation}</span>}
              </div>
            </div>
          </header>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2 [&>section]:h-full">
              <Panel title="Assignment">
                <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Detail label="Department" value={department} />
                  <Detail label="Manager" value={managerName} />
                  <Detail label="Position" value={position} />
                  <Detail label="Office location" value={record.officeLocation} />
                  {team && <Detail label="Team" value={team} />}
                </dl>
              </Panel>
            </div>
            <Panel title="Contract">
              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="col-span-2 rounded-xl bg-blue-50 p-3">
                  <Detail label="Employment type" value={employmentType} />
                </div>
                <div className="rounded-xl bg-slate-50 p-3"><Detail label="Start date" value={formatDate(startDate)} /></div>
                <div className="rounded-xl bg-slate-50 p-3"><Detail label="Onboarding" value={record.onboardingStatus === "completed" ? "Completed" : "Pending"} /></div>
              </dl>
            </Panel>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Reporting Hierarchy">
              <div className="mt-5 flex flex-col items-center text-center text-sm">
                <div className="w-full max-w-64 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="font-semibold text-slate-900">{managerName || "Manager unavailable"}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{manager?.jobTitle || "Reporting manager"}</p>
                </div>
                <div aria-hidden="true" className="h-5 w-px bg-blue-200" />
                <div className="w-full max-w-64 rounded-xl bg-blue-700 p-3 text-white">
                  <p className="font-semibold">{name}</p>
                  {position && <p className="mt-0.5 text-xs text-blue-100">{position}</p>}
                </div>
              </div>
              <h3 className="mt-5 text-sm font-semibold text-slate-900">Direct reports</h3>
              <div className="mt-2">
                <ResourceState loading={hierarchy.loading} error={hierarchy.error} retry={hierarchy.reload} />
                {!hierarchy.loading && !hierarchy.error && (
                  directReports.length ? (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {directReports.map((person) => (
                        <li key={person._id}>
                          <Link href={`/hr/onboarding/${encodeURIComponent(person._id)}`} className="block rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-blue-50">
                            <span className="block font-semibold text-blue-700">{person.fullName}</span>
                            {person.designation && <span className="text-xs text-slate-600">{person.designation}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-slate-600">No direct reports recorded.</p>
                )}
              </div>
            </Panel>

            <Panel title="Career Progression">
              <ol className="mt-5 space-y-5 border-l border-blue-200 pl-4">
                <li className="relative">
                  <span aria-hidden="true" className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Current position</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{position || "Unavailable"}</p>
                  {startDate && <p className="mt-1 text-sm text-slate-600">Joined {formatDate(startDate)}</p>}
                </li>
                {(record.previousJobTitle || record.previousCompany) && (
                  <li className="relative">
                    <span aria-hidden="true" className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previous experience</p>
                    {record.previousJobTitle && <p className="mt-1 text-sm font-semibold text-slate-900">{record.previousJobTitle}</p>}
                    {record.previousCompany && <p className="mt-1 text-sm text-slate-600">{record.previousCompany}</p>}
                  </li>
                )}
              </ol>
              <p className="mt-5 text-sm text-slate-600">Promotion history is unavailable.</p>
            </Panel>
          </div>
        </>
      )}
    </main>
  );
}
