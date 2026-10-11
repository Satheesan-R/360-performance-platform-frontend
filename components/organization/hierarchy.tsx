"use client";

import { useState, type FormEvent } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getHierarchy, updateReportingManager } from "@/services/organization.service";
import { getApiErrorMessage } from "@/lib/api";
import { hierarchyRows, unavailableManagers } from "@/lib/organization-hierarchy";
import type { HierarchyEmployee } from "@/types/organization";
import { buttonClass, secondaryClass, inputClass, Field, PageHeading, ResourceState } from "./ui";

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
    {success && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {selected && <form onSubmit={save} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="mb-5 text-lg font-bold">Reporting manager for {selected.fullName}</h2><fieldset disabled={saving}><Field label="Reporting manager"><select className={inputClass} value={managerId} onChange={(event) => setManagerId(event.target.value)}><option value="">No manager (top level)</option>{employees.filter((employee) => !blocked.has(employee._id)).map((employee) => <option key={employee._id} value={employee._id}>{employee.fullName}{employee.designation ? ` — ${employee.designation}` : ""}</option>)}</select></Field><p className="mt-3 text-xs text-slate-500">The employee and their direct or indirect reports cannot be selected as their manager.</p></fieldset><div className="mt-5 flex gap-3"><button type="submit" className={buttonClass} disabled={saving}>{saving ? "Saving..." : "Save manager"}</button><button type="button" className={secondaryClass} disabled={saving} onClick={() => { setSelected(null); setError(""); }}>Cancel</button></div></form>}
    <label className="mb-5 block"><span className="sr-only">Search employees</span><input type="search" className={inputClass} placeholder="Search employees, departments or designations" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    <ResourceState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!resource.loading && !resource.error && <section aria-label="Reporting relationships" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-4 text-sm text-slate-500">{employees.length} employees · Indentation shows reporting levels.</p>
      {rows.some((row) => row.disconnected) && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Some reporting relationships have a missing manager or a cycle. Review the marked employees.</p>}
      <ul className="space-y-3">{rows.map(({ employee, depth, disconnected }) => <li key={employee._id} style={{ marginLeft: search ? 0 : Math.min(depth, 10) * 24 }} className="flex min-w-72 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 border-l-4 border-l-blue-400 p-4"><div><p className="font-semibold">{employee.fullName}</p><p className="mt-1 text-xs text-slate-500">{[employee.designation, employee.departmentName].filter(Boolean).join(" · ") || "Employee"}</p><p className="mt-2 text-xs text-slate-600">Reports to: {employee.reportingManagerId ? employees.find((manager) => manager._id === employee.reportingManagerId)?.fullName ?? "Manager unavailable" : "Top level"}</p>{disconnected && <p className="mt-1 text-xs text-amber-700">Review reporting relationship</p>}</div><button type="button" className={secondaryClass} disabled={Boolean(selected)} aria-label={`Change manager for ${employee.fullName}`} onClick={() => { setSelected(employee); const invalid = unavailableManagers(employees, employee._id); setManagerId(employee.reportingManagerId && !invalid.has(employee.reportingManagerId) && employees.some((manager) => manager._id === employee.reportingManagerId) ? employee.reportingManagerId : ""); setError(""); setSuccess(""); }}>Change manager</button></li>)}</ul>
      {rows.length === 0 && <p className="p-8 text-center text-sm text-slate-500">{employees.length ? "No employees match your search." : "No employees yet. Add employees through Employee Onboarding."}</p>}
    </section>}
  </>;
}
