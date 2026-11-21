"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import {
  personLabel,
  referenceId,
  referenceLabel,
} from "@/lib/organization-views";
import {
  deactivateDepartment,
  getDepartments,
  getDepartmentSummary,
  getTeams,
} from "@/services/organization-views.service";
import type { DepartmentRecord, TeamRecord } from "@/types/organization-views";
import {
  buttonClass,
  PageHeading,
  ResourceState,
  secondaryClass,
  Status,
} from "./ui";
import {
  ViewFilters,
  ViewPagination,
  viewActionClass,
  viewCellClass,
  viewHeadClass,
  viewTableClass,
} from "./view-controls";
import StructureEditor from "./structure-editor";

export function DeactivateDepartment({
  department,
  onDone,
  onCancel,
}: {
  department: DepartmentRecord;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await deactivateDepartment(department._id);
      onDone();
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      role="region"
      aria-label="Confirm department deactivation"
      className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"
    >
      <h2 className="font-bold">Deactivate {department.name}?</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        The department, head, teams, and employee assignments will be retained.
        New team memberships will be blocked until the department is active
        again.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className={buttonClass}
          disabled={busy}
          onClick={() => void confirm()}
        >
          {busy ? "Deactivating..." : "Deactivate"}
        </button>
        <button
          type="button"
          className={secondaryClass}
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

function DepartmentSummaryCards({ revision }: { revision: number }) {
  void revision;
  const resource = useOrganizationResource(getDepartmentSummary);
  return (
    <section
      aria-label="Department summary"
      className="mb-6"
    >
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!resource.loading && !resource.error && resource.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          {(["total", "active", "inactive"] as const).map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm capitalize text-slate-500">
                {key} departments
              </p>
              <p className="mt-2 text-3xl font-bold">{resource.data![key]}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StructureRows({
  kind,
  departmentId,
  filters,
  disabled,
  onEdit,
  onDeactivate,
  onPage,
}: {
  kind: "departments" | "teams";
  departmentId?: string;
  filters: { search: string; status: string; page: number };
  disabled: boolean;
  onEdit: (record: DepartmentRecord | TeamRecord) => void;
  onDeactivate: (department: DepartmentRecord) => void;
  onPage: (page: number) => void;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (kind === "departments") {
        const result = await getDepartments(filters, signal);
        return { items: result.departments, pagination: result.pagination };
      }
      const result = await getTeams(filters, departmentId, signal);
      return { items: result.teams, pagination: result.pagination };
    },
    [kind, departmentId, filters],
  );
  const resource = useOrganizationResource(load);
  const data = resource.data;
  return (
    <>
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!resource.loading && !resource.error && data && (
        <>
          {!data.items.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h3 className="font-semibold">No {kind} found</h3>
              <p className="mt-2 text-sm text-slate-500">
                {filters.search || filters.status
                  ? "Try another search or status filter."
                  : `Add your first ${kind === "departments" ? "department" : "team"} to get started.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className={viewTableClass}>
                <thead className="bg-slate-50/80">
                  <tr>
                    {[
                      kind === "departments" ? "Department" : "Team",
                      ...(kind === "departments"
                        ? ["Head", "Teams"]
                        : ["Department", "Team lead"]),
                      "Employees",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className={viewHeadClass}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((record) => (
                    <tr
                      key={record._id}
                      className="transition-colors hover:bg-blue-50/40"
                    >
                      <td className={viewCellClass}>
                        <Link
                          href={`/hr/organization/${kind}/${record._id}`}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {record.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.code}
                        </p>
                        {record.description && (
                          <p className="mt-2 max-w-xs text-xs leading-5">
                            {record.description}
                          </p>
                        )}
                      </td>
                      {"headEmployeeId" in record ? (
                        <>
                          <td className={viewCellClass}>
                            {personLabel(record.headEmployeeId)}
                          </td>
                          <td className={viewCellClass}>{record.teamCount}</td>
                        </>
                      ) : (
                        <>
                          <td className={viewCellClass}>
                            {referenceId(record.departmentId) ? (
                              <Link
                                className="text-blue-700 hover:underline"
                                href={`/hr/organization/departments/${referenceId(record.departmentId)}`}
                              >
                                {referenceLabel(record.departmentId)}
                              </Link>
                            ) : (
                              "Unassigned"
                            )}
                          </td>
                          <td className={viewCellClass}>
                            {personLabel(record.teamLeadEmployeeId)}
                          </td>
                        </>
                      )}
                      <td className={viewCellClass}>{record.employeeCount}</td>
                      <td className={viewCellClass}>
                        <Status value={record.status} />
                      </td>
                      <td className={viewCellClass}>
                        <div className="flex items-center gap-1">
                          <Link
                            className={viewActionClass}
                            href={`/hr/organization/${kind}/${record._id}`}
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            className={viewActionClass}
                            disabled={disabled}
                            onClick={() => onEdit(record)}
                          >
                            Edit
                          </button>
                          {"headEmployeeId" in record &&
                            record.status === "active" && (
                              <button
                                type="button"
                                className={`${viewActionClass} text-red-700`}
                                disabled={disabled}
                                onClick={() => onDeactivate(record)}
                              >
                                Deactivate
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ViewPagination
            pagination={data.pagination}
            disabled={disabled}
            onPage={onPage}
          />
        </>
      )}
    </>
  );
}

export default function StructureDirectory({
  kind,
  departmentId,
  onChanged,
}: {
  kind: "departments" | "teams";
  departmentId?: string;
  onChanged?: () => void;
}) {
  const [filters, setFilters] = useState({ search: "", status: "", page: 1 });
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<{
    record?: DepartmentRecord | TeamRecord;
  } | null>(null);
  const [deactivating, setDeactivating] = useState<DepartmentRecord | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const noun = kind === "departments" ? "Department" : "Team";
  const locked = Boolean(editor || deactivating);
  function changed(message: string) {
    setEditor(null);
    setDeactivating(null);
    setMessage(message);
    setRevision((value) => value + 1);
    onChanged?.();
  }
  const add = (
    <button
      type="button"
      className={buttonClass}
      disabled={locked}
      onClick={() => {
        setEditor({});
        setMessage("");
      }}
    >
      + Add {noun}
    </button>
  );
  return (
    <>
      {departmentId ? (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Teams</h2>
          {add}
        </div>
      ) : (
        <PageHeading
          title={kind === "departments" ? "Departments" : "Teams"}
          description={
            kind === "departments"
              ? "Manage departments, their heads, teams, and employees."
              : "Manage teams, department placement, and team leads."
          }
        >
          {add}
        </PageHeading>
      )}
      {kind === "departments" && (
        <DepartmentSummaryCards
          key={revision}
          revision={revision}
        />
      )}
      {message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}
      {editor && (
        <StructureEditor
          kind={kind}
          record={editor.record}
          departmentId={departmentId}
          onSaved={() => changed(`${noun} saved.`)}
          onCancel={() => setEditor(null)}
        />
      )}
      {deactivating && (
        <DeactivateDepartment
          department={deactivating}
          onDone={() =>
            changed(
              "Department deactivated. Existing relationships are preserved.",
            )
          }
          onCancel={() => setDeactivating(null)}
        />
      )}
      <ViewFilters
        search={filters.search}
        status={filters.status}
        disabled={locked}
        onSearch={(search) => setFilters({ ...filters, search, page: 1 })}
        onStatus={(status) => setFilters({ ...filters, status, page: 1 })}
      />
      <StructureRows
        key={`${JSON.stringify(filters)}:${revision}`}
        kind={kind}
        departmentId={departmentId}
        filters={filters}
        disabled={locked}
        onEdit={(record) => {
          setEditor({ record });
          setMessage("");
        }}
        onDeactivate={setDeactivating}
        onPage={(page) => setFilters({ ...filters, page })}
      />
    </>
  );
}
