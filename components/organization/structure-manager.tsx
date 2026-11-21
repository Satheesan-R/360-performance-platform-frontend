"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import {
  getStructure,
  getPermissions,
  saveStructure,
  deactivateEmploymentType,
} from "@/services/organization.service";
import { getEmployees } from "@/services/employee.service";
import { getToken } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import type {
  StructureInput,
  StructureKind,
  StructureRecord,
} from "@/types/organization";
import {
  buttonClass,
  secondaryClass,
  inputClass,
  Field,
  Status,
  PageHeading,
  ResourceState,
} from "./ui";
import { ActionIcon, viewActionClass } from "./view-controls";

const settings = {
  departments: {
    title: "Departments",
    singular: "Department",
    description: "Manage business units and their department heads.",
  },
  teams: {
    title: "Teams",
    singular: "Team",
    description: "Organize teams within departments and assign team leads.",
  },
  "employment-types": {
    title: "Employment Types",
    singular: "Employment Type",
    description:
      "Configure the employment classifications used by your company.",
  },
  roles: {
    title: "Roles & Permissions",
    singular: "Role",
    description:
      "Define access roles and the permissions available to each role.",
  },
};

function employeeName(employee: {
  fullName?: string;
  firstName?: string;
  lastName?: string;
}) {
  return (
    employee.fullName ||
    `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
    "Unnamed employee"
  );
}

export default function StructureManager({ kind }: { kind: StructureKind }) {
  const info = settings[kind];
  const load = useCallback(
    async (signal: AbortSignal) => {
      const records = await getStructure(kind, signal);
      return records;
    },
    [kind],
  );
  const resource = useOrganizationResource(load);
  const loadOptions = useCallback(
    async (signal: AbortSignal) => {
      const token = getToken();
      if (!token)
        throw new Error("Your session has expired. Please log in again.");
      const [employees, departments, permissions] = await Promise.all([
        kind === "departments" || kind === "teams"
          ? getEmployees(token, signal)
          : Promise.resolve([]),
        kind === "teams"
          ? getStructure("departments", signal)
          : Promise.resolve([]),
        kind === "roles" ? getPermissions(signal) : Promise.resolve([]),
      ]);
      return { employees, departments, permissions };
    },
    [kind],
  );
  const options = useOrganizationResource(loadOptions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [draft, setDraft] = useState<StructureInput | null>(null);
  const [editingId, setEditingId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewing, setViewing] = useState<StructureRecord | null>(null);
  const [deactivating, setDeactivating] = useState<StructureRecord | null>(null);

  async function confirmDeactivation() {
    if (!deactivating || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await deactivateEmploymentType(deactivating._id);
      setDeactivating(null);
      setSuccess("Employment type deactivated.");
      await resource.reload();
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }
  function edit(record?: StructureRecord) {
    setEditingId(record?._id);
    setDraft(
      record
        ? {
            name: record.name,
            code: record.code,
            description: record.description ?? "",
            status: record.status,
            ...(kind === "departments"
              ? { departmentHeadId: record.departmentHeadId ?? "" }
              : {}),
            ...(kind === "teams"
              ? {
                  departmentId: record.departmentId ?? "",
                  teamLeadId: record.teamLeadId ?? "",
                }
              : {}),
            ...(kind === "roles"
              ? { permissions: record.permissions ?? [] }
              : {}),
          }
        : {
            name: "",
            code: "",
            description: "",
            status: "active",
            ...(kind === "roles" ? { permissions: [] } : {}),
          },
    );
    setError("");
    setSuccess("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    if (!draft.name.trim() || !draft.code.trim()) {
      setError("Name and code are required.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await saveStructure(
        kind,
        { ...draft, name: draft.name.trim(), code: draft.code.trim() },
        editingId,
      );
      setDraft(null);
      setSuccess(`${info.singular} ${editingId ? "updated" : "created"}.`);
      await resource.reload();
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }
  const rows = (resource.data ?? []).filter(
    (record) =>
      (status === "all" || record.status === status) &&
      `${record.name} ${record.code} ${record.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const employeeLabel = (id?: string) => {
    const employee = options.data?.employees.find((item) => item._id === id);
    return employee
      ? employeeName(employee)
      : id
        ? "Employee unavailable"
        : "Unassigned";
  };
  return (
    <>
      <PageHeading
        title={info.title}
        description={info.description}
      >
        <button
          type="button"
          disabled={
            Boolean(draft || viewing || deactivating) || resource.loading || Boolean(resource.error)
          }
          className={buttonClass}
          onClick={() => edit()}
        >
          + Add {info.singular}
        </button>
      </PageHeading>
      {viewing && (
        <section aria-label="Employment type details" className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-bold text-slate-900">{viewing.name}</h2>
            <button type="button" className={secondaryClass} onClick={() => setViewing(null)}>Close</button>
          </div>
          <p className="mt-2 text-sm text-slate-600">{viewing.code}</p>
          <p className="mt-2 text-sm text-slate-600">{viewing.description || "No description provided."}</p>
          <div className="mt-3"><Status value={viewing.status} /></div>
        </section>
      )}
      {deactivating && (
        <section aria-label="Confirm employment type deactivation" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-slate-900">Deactivate {deactivating.name}?</h2>
          <p className="mt-2 text-sm text-slate-700">Existing employee classifications are preserved. This type will be unavailable for new assignments.</p>
          {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={saving} className={buttonClass} onClick={() => void confirmDeactivation()}>{saving ? "Deactivating..." : "Deactivate"}</button>
            <button type="button" disabled={saving} className={secondaryClass} onClick={() => { setDeactivating(null); setError(""); }}>Cancel</button>
          </div>
        </section>
      )}
      {success && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}
      {error && !deactivating && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {draft && (
        <form
          onSubmit={save}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <h2 className="mb-5 text-lg font-bold tracking-tight text-slate-950">
            {editingId ? "Edit" : "Add"} {info.singular}
          </h2>
          <ResourceState
            loading={options.loading}
            error={options.error}
            retry={options.reload}
          />
          <fieldset
            disabled={saving || options.loading || Boolean(options.error)}
            className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5"
          >
            <Field label={`${info.singular} name *`}>
              <input
                required
                maxLength={120}
                className={inputClass}
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </Field>
            <Field label={`${info.singular} code *`}>
              <input
                required
                maxLength={40}
                className={inputClass}
                value={draft.code}
                onChange={(event) =>
                  setDraft({ ...draft, code: event.target.value })
                }
              />
            </Field>
            {kind === "teams" && (
              <Field label="Department *">
                <select
                  required
                  className={inputClass}
                  value={draft.departmentId ?? ""}
                  onChange={(event) =>
                    setDraft({ ...draft, departmentId: event.target.value })
                  }
                >
                  <option value="">Select department</option>
                  {options.data?.departments
                    .filter(
                      (department) =>
                        department.status === "active" ||
                        department._id === draft.departmentId,
                    )
                    .map((department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.name}
                        {department.status === "inactive" ? " (Inactive)" : ""}
                      </option>
                    ))}
                </select>
              </Field>
            )}
            {(kind === "departments" || kind === "teams") && (
              <Field
                label={kind === "departments" ? "Department head" : "Team lead"}
              >
                <select
                  className={inputClass}
                  value={
                    (kind === "departments"
                      ? draft.departmentHeadId
                      : draft.teamLeadId) ?? ""
                  }
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      [kind === "departments"
                        ? "departmentHeadId"
                        : "teamLeadId"]: event.target.value,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {options.data?.employees.map((employee) => (
                    <option
                      key={employee._id}
                      value={employee._id}
                    >
                      {employeeName(employee)} (
                      {employee.employeeNumber || employee.workEmail})
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Status">
              <select
                className={inputClass}
                value={draft.status}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    status: event.target.value as StructureInput["status"],
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea
                  rows={3}
                  maxLength={2000}
                  className={inputClass}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </Field>
            </div>
            {kind === "roles" && (
              <fieldset className="sm:col-span-2">
                <legend className="mb-3 text-sm font-semibold">
                  Permissions
                </legend>
                {options.data?.permissions.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No permissions available. Configure permissions in the
                    backend first.
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {options.data?.permissions.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-blue-600"
                        checked={
                          draft.permissions?.includes(permission.key) ?? false
                        }
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            permissions: event.target.checked
                              ? [...(draft.permissions ?? []), permission.key]
                              : draft.permissions?.filter(
                                  (key) => key !== permission.key,
                                ),
                          })
                        }
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {permission.label}
                        </span>
                        {permission.description && (
                          <span className="mt-1 block text-xs text-slate-500">
                            {permission.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </fieldset>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              className={`${secondaryClass} w-full sm:w-auto`}
              onClick={() => {
                setDraft(null);
                setError("");
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || options.loading || Boolean(options.error)}
              className={`${buttonClass} w-full sm:w-auto`}
            >
              {saving ? "Saving..." : `Save ${info.singular}`}
            </button>
          </div>
        </form>
      )}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">Search {info.title}</span>
          <input
            type="search"
            className={inputClass}
            placeholder={`Search ${info.title.toLowerCase()} by name or code`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Filter by status</span>
          <select
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!draft && options.error && (
        <div className="mb-4">
          <ResourceState
            loading={false}
            error={options.error}
            retry={options.reload}
          />
        </div>
      )}
      {!resource.loading && !resource.error && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  info.singular,
                  ...(kind === "departments"
                    ? ["Department Head", "Employees"]
                    : kind === "teams"
                      ? ["Department", "Team Lead", "Employees"]
                      : kind === "roles"
                        ? ["Permissions"]
                        : []),
                  "Status",
                  "Actions",
                ].map((label) => (
                  <th
                    scope="col"
                    key={label}
                    className="whitespace-nowrap px-4 py-4 font-bold sm:px-5"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((record) => (
                <tr
                  key={record._id}
                  className="transition-colors hover:bg-blue-50/40"
                >
                  <td className="px-4 py-4 sm:px-5">
                    <p className="font-semibold text-slate-900">
                      {record.name}
                    </p>
                    <p className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {record.code}
                    </p>
                    {record.description && (
                      <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                        {record.description}
                      </p>
                    )}
                  </td>
                  {kind === "departments" && (
                    <>
                      <td className="px-4 py-4 text-slate-600 sm:px-5">
                        {employeeLabel(record.departmentHeadId)}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-700 sm:px-5">
                        {record.employeeCount ?? "—"}
                      </td>
                    </>
                  )}
                  {kind === "teams" && (
                    <>
                      <td className="px-4 py-4 text-slate-600 sm:px-5">
                        {options.data?.departments.find(
                          (department) =>
                            department._id === record.departmentId,
                        )?.name ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 sm:px-5">
                        {employeeLabel(record.teamLeadId)}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-700 sm:px-5">
                        {record.employeeCount ?? "—"}
                      </td>
                    </>
                  )}
                  {kind === "roles" && (
                    <td className="max-w-sm px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {record.permissions?.length
                          ? record.permissions.map((key) => (
                              <span
                                key={key}
                                className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                              >
                                {options.data?.permissions.find(
                                  (permission) => permission.key === key,
                                )?.label ?? key}
                              </span>
                            ))
                          : "No permissions"}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4 sm:px-5">
                    <Status value={record.status} />
                  </td>
                  <td className="px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-1.5">
                      {kind === "employment-types" && (
                        <button type="button" disabled={Boolean(draft || viewing || deactivating)} className={viewActionClass} title="View" aria-label={`View ${record.name}`} onClick={() => setViewing(record)}>
                          <ActionIcon action="view" />
                        </button>
                      )}
                      <button type="button" disabled={Boolean(draft || viewing || deactivating)} className={viewActionClass} title="Edit" aria-label={`Edit ${record.name}`} onClick={() => edit(record)}>
                        <ActionIcon action="edit" />
                      </button>
                      {kind === "employment-types" && record.status === "active" && (
                        <button type="button" disabled={Boolean(draft || viewing || deactivating)} className={`${viewActionClass} text-red-700 hover:bg-red-50`} title="Deactivate" aria-label={`Deactivate ${record.name}`} onClick={() => { setError(""); setSuccess(""); setDeactivating(record); }}>
                          <ActionIcon action="delete" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="border-t border-slate-100 px-5 py-12 text-center text-sm text-slate-500">
              {resource.data?.length
                ? "No results match your search."
                : `No ${info.title.toLowerCase()} yet. Add your first ${info.singular.toLowerCase()} to get started.`}
            </p>
          )}
        </div>
      )}
    </>
  );
}
