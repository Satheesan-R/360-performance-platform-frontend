"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getStructure, getPermissions, saveStructure } from "@/services/organization.service";
import { getEmployees } from "@/services/employee.service";
import { getToken } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import type { StructureInput, StructureKind, StructureRecord } from "@/types/organization";
import { buttonClass, secondaryClass, inputClass, Field, Status, PageHeading, ResourceState } from "./ui";

const settings = {
  departments: { title: "Departments", singular: "Department", description: "Manage business units and their department heads." },
  teams: { title: "Teams", singular: "Team", description: "Organize teams within departments and assign team leads." },
  "employment-types": { title: "Employment Types", singular: "Employment Type", description: "Configure the employment classifications used by your company." },
  roles: { title: "Roles & Permissions", singular: "Role", description: "Define access roles and the permissions available to each role." },
};

function employeeName(employee: { fullName?: string; firstName?: string; lastName?: string }) {
  return employee.fullName || `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || "Unnamed employee";
}

export default function StructureManager({ kind }: { kind: StructureKind }) {
  const info = settings[kind];
  const load = useCallback(async (signal: AbortSignal) => {
    const records = await getStructure(kind, signal);
    return records;
  }, [kind]);
  const resource = useOrganizationResource(load);
  const loadOptions = useCallback(async (signal: AbortSignal) => {
    const token = getToken();
    if (!token) throw new Error("Your session has expired. Please log in again.");
    const [employees, departments, permissions] = await Promise.all([
      kind === "departments" || kind === "teams" ? getEmployees(token, signal) : Promise.resolve([]),
      kind === "teams" ? getStructure("departments", signal) : Promise.resolve([]),
      kind === "roles" ? getPermissions(signal) : Promise.resolve([]),
    ]);
    return { employees, departments, permissions };
  }, [kind]);
  const options = useOrganizationResource(loadOptions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [draft, setDraft] = useState<StructureInput | null>(null);
  const [editingId, setEditingId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function edit(record?: StructureRecord) {
    setEditingId(record?._id);
    setDraft(record ? { name: record.name, code: record.code, description: record.description ?? "", status: record.status, ...(kind === "departments" ? { departmentHeadId: record.departmentHeadId ?? "" } : {}), ...(kind === "teams" ? { departmentId: record.departmentId ?? "", teamLeadId: record.teamLeadId ?? "" } : {}), ...(kind === "roles" ? { permissions: record.permissions ?? [] } : {}) } : { name: "", code: "", description: "", status: "active", ...(kind === "roles" ? { permissions: [] } : {}) });
    setError(""); setSuccess("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    if (!draft.name.trim() || !draft.code.trim()) { setError("Name and code are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await saveStructure(kind, { ...draft, name: draft.name.trim(), code: draft.code.trim() }, editingId);
      setDraft(null); setSuccess(`${info.singular} ${editingId ? "updated" : "created"}.`);
      await resource.reload();
    } catch (error) { setError(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  }
  const rows = (resource.data ?? []).filter((record) => (status === "all" || record.status === status) && `${record.name} ${record.code} ${record.description}`.toLowerCase().includes(search.trim().toLowerCase()));
  const employeeLabel = (id?: string) => {
    const employee = options.data?.employees.find((item) => item._id === id);
    return employee ? employeeName(employee) : id ? "Employee unavailable" : "Unassigned";
  };
  return <>
    <PageHeading title={info.title} description={info.description}><button type="button" disabled={Boolean(draft) || resource.loading || Boolean(resource.error)} className={buttonClass} onClick={() => edit()}>+ Add {info.singular}</button></PageHeading>
    {success && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {draft && <form onSubmit={save} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold">{editingId ? "Edit" : "Add"} {info.singular}</h2>
      <ResourceState loading={options.loading} error={options.error} retry={options.reload} />
      <fieldset disabled={saving || options.loading || Boolean(options.error)} className="mt-4 grid gap-5 sm:grid-cols-2">
        <Field label={`${info.singular} name *`}><input required maxLength={120} className={inputClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
        <Field label={`${info.singular} code *`}><input required maxLength={40} className={inputClass} value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} /></Field>
        {kind === "teams" && <Field label="Department *"><select required className={inputClass} value={draft.departmentId ?? ""} onChange={(event) => setDraft({ ...draft, departmentId: event.target.value })}><option value="">Select department</option>{options.data?.departments.filter((department) => department.status === "active" || department._id === draft.departmentId).map((department) => <option key={department._id} value={department._id}>{department.name}{department.status === "inactive" ? " (Inactive)" : ""}</option>)}</select></Field>}
        {(kind === "departments" || kind === "teams") && <Field label={kind === "departments" ? "Department head" : "Team lead"}><select className={inputClass} value={(kind === "departments" ? draft.departmentHeadId : draft.teamLeadId) ?? ""} onChange={(event) => setDraft({ ...draft, [kind === "departments" ? "departmentHeadId" : "teamLeadId"]: event.target.value })}><option value="">Unassigned</option>{options.data?.employees.map((employee) => <option key={employee._id} value={employee._id}>{employeeName(employee)} ({employee.employeeNumber || employee.workEmail})</option>)}</select></Field>}
        <Field label="Status"><select className={inputClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as StructureInput["status"] })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <div className="sm:col-span-2"><Field label="Description"><textarea rows={3} maxLength={2000} className={inputClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field></div>
        {kind === "roles" && <fieldset className="sm:col-span-2"><legend className="mb-3 text-sm font-semibold">Permissions</legend>{options.data?.permissions.length === 0 && <p className="text-sm text-slate-500">No permissions available. Configure permissions in the backend first.</p>}<div className="grid gap-3 sm:grid-cols-2">{options.data?.permissions.map((permission) => <label key={permission.key} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={draft.permissions?.includes(permission.key) ?? false} onChange={(event) => setDraft({ ...draft, permissions: event.target.checked ? [...(draft.permissions ?? []), permission.key] : draft.permissions?.filter((key) => key !== permission.key) })} /><span><span className="block text-sm font-medium">{permission.label}</span>{permission.description && <span className="mt-1 block text-xs text-slate-500">{permission.description}</span>}</span></label>)}</div></fieldset>}
      </fieldset>
      <div className="mt-6 flex gap-3"><button type="submit" disabled={saving || options.loading || Boolean(options.error)} className={buttonClass}>{saving ? "Saving..." : `Save ${info.singular}`}</button><button type="button" disabled={saving} className={secondaryClass} onClick={() => { setDraft(null); setError(""); }}>Cancel</button></div>
    </form>}
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">Search {info.title}</span><input type="search" className={inputClass} placeholder={`Search ${info.title.toLowerCase()} by name or code`} value={search} onChange={(event) => setSearch(event.target.value)} /></label><label><span className="sr-only">Filter by status</span><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div>
    <ResourceState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!draft && options.error && <div className="mb-4"><ResourceState loading={false} error={options.error} retry={options.reload} /></div>}
    {!resource.loading && !resource.error && <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{[info.singular, ...(kind === "departments" ? ["Department Head", "Employees"] : kind === "teams" ? ["Department", "Team Lead", "Employees"] : kind === "roles" ? ["Permissions"] : []), "Status", "Actions"].map((label) => <th scope="col" key={label} className="whitespace-nowrap px-5 py-4 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((record) => <tr key={record._id}><td className="px-5 py-4"><p className="font-semibold">{record.name}</p><p className="mt-1 text-xs text-slate-500">{record.code}</p>{record.description && <p className="mt-1 max-w-xs text-xs text-slate-500">{record.description}</p>}</td>{kind === "departments" && <><td className="px-5 py-4">{employeeLabel(record.departmentHeadId)}</td><td className="px-5 py-4">{record.employeeCount ?? "—"}</td></>}{kind === "teams" && <><td className="px-5 py-4">{options.data?.departments.find((department) => department._id === record.departmentId)?.name ?? "—"}</td><td className="px-5 py-4">{employeeLabel(record.teamLeadId)}</td><td className="px-5 py-4">{record.employeeCount ?? "—"}</td></>}{kind === "roles" && <td className="max-w-sm px-5 py-4"><div className="flex flex-wrap gap-1">{record.permissions?.length ? record.permissions.map((key) => <span key={key} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{options.data?.permissions.find((permission) => permission.key === key)?.label ?? key}</span>) : "No permissions"}</div></td>}<td className="px-5 py-4"><Status value={record.status} /></td><td className="px-5 py-4"><button type="button" disabled={Boolean(draft)} className="font-semibold text-blue-600 disabled:opacity-40" aria-label={`Edit ${record.name}`} onClick={() => edit(record)}>Edit</button></td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-10 text-center text-sm text-slate-500">{resource.data?.length ? "No results match your search." : `No ${info.title.toLowerCase()} yet. Add your first ${info.singular.toLowerCase()} to get started.`}</p>}</div>}
  </>;
}
