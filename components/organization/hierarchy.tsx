"use client";

import { useState, type FormEvent } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getHierarchy, updateReportingManager } from "@/services/organization.service";
import { getApiErrorMessage } from "@/lib/api";
import { hierarchyRows, unavailableManagers } from "@/lib/organization-hierarchy";
import type { HierarchyEmployee } from "@/types/organization";
import { buttonClass, secondaryClass, inputClass, Field, PageHeading, ResourceState } from "./ui";

const indentationClasses = ["sm:ml-0", "sm:ml-6", "sm:ml-12", "sm:ml-[4.5rem]", "sm:ml-24", "sm:ml-[7.5rem]", "sm:ml-36", "sm:ml-[10.5rem]", "sm:ml-48", "sm:ml-[13.5rem]", "sm:ml-60"];

export default function ReportingHierarchy() {
  const resource = useOrganizationResource(getHierarchy);
  const [selected, setSelected] = useState<HierarchyEmployee | null>(null);
  const [managerId, setManagerId] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const employees = resource.data ?? [];
  const blocked = selected ? unavailableManagers(employees, selected._id) : new Set<string>();
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || saving) return;
    if (managerId && blocked.has(managerId)) { setError("Choose a manager outside this employee's reporting chain."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateReportingManager(selected._id, managerId || null);
      setSelected(null); setSuccess("Reporting manager updated.");
      await resource.reload();
    } catch (error) { setError(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  }
  const rows = hierarchyRows(employees).filter(({ employee }) => `${employee.fullName} ${employee.designation ?? ""} ${employee.departmentName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <>
    <PageHeading title="Reporting Hierarchy" description="Explore reporting relationships and assign each employee's manager." />
    {success && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</p>}
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {selected && <form onSubmit={save} className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="mb-5 text-lg font-bold tracking-tight text-slate-950">Reporting manager for {selected.fullName}</h2><fieldset disabled={saving}><Field label="Reporting manager"><select className={inputClass} value={managerId} onChange={(event) => setManagerId(event.target.value)}><option value="">No manager (top level)</option>{employees.filter((employee) => !blocked.has(employee._id)).map((employee) => <option key={employee._id} value={employee._id}>{employee.fullName}{employee.designation ? ` — ${employee.designation}` : ""}</option>)}</select></Field><p className="mt-3 text-xs leading-5 text-slate-500">The employee and their direct or indirect reports cannot be selected as their manager.</p></fieldset><div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" className={`${secondaryClass} w-full sm:w-auto`} disabled={saving} onClick={() => { setSelected(null); setError(""); }}>Cancel</button><button type="submit" className={`${buttonClass} w-full sm:w-auto`} disabled={saving}>{saving ? "Saving..." : "Save manager"}</button></div></form>}
    <label className="mb-5 block"><span className="sr-only">Search employees</span><input type="search" className={inputClass} placeholder="Search employees, departments or designations" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    <ResourceState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!resource.loading && !resource.error && <section aria-label="Reporting relationships" className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm sm:p-5">
      <p className="mb-4 text-sm text-slate-500">{employees.length} employees · Indentation shows reporting levels.</p>
      {rows.some((row) => row.disconnected) && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Some reporting relationships have a missing manager or a cycle. Review the marked employees.</p>}
      <ul className="space-y-3">{rows.map(({ employee, depth, disconnected }) => <li key={employee._id} className={`flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30 ${search ? "sm:ml-0" : indentationClasses[Math.min(depth, 10)]}`}><div className="min-w-0"><p className="break-words font-semibold text-slate-900">{employee.fullName}</p><p className="mt-1 text-xs text-slate-500">{[employee.designation, employee.departmentName].filter(Boolean).join(" · ") || "Employee"}</p><p className="mt-2 text-xs text-slate-600">Reports to: {employee.reportingManagerId ? employees.find((manager) => manager._id === employee.reportingManagerId)?.fullName ?? "Manager unavailable" : "Top level"}</p>{disconnected && <p className="mt-1 text-xs font-medium text-amber-700">Review reporting relationship</p>}</div><button type="button" className={`${secondaryClass} w-full sm:w-auto`} disabled={Boolean(selected)} aria-label={`Change manager for ${employee.fullName}`} onClick={() => { setSelected(employee); const invalid = unavailableManagers(employees, employee._id); setManagerId(employee.reportingManagerId && !invalid.has(employee.reportingManagerId) && employees.some((manager) => manager._id === employee.reportingManagerId) ? employee.reportingManagerId : ""); setError(""); setSuccess(""); }}>Change manager</button></li>)}</ul>
      {rows.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">{employees.length ? "No employees match your search." : "No employees yet. Add employees through Employee Onboarding."}</p>}
    </section>}
  </>;
}
