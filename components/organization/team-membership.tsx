"use client";

import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import {
  directoryName,
  referenceId,
  referenceLabel,
} from "@/lib/organization-views";
import {
  assignEmployeeTeam,
  getDirectory,
} from "@/services/organization-views.service";
import type { DirectoryPerson } from "@/types/organization-views";
import { buttonClass, ResourceState, secondaryClass } from "./ui";
import { ViewFilters, ViewPagination } from "./view-controls";

function CandidateRows({
  departmentId,
  teamId,
  filters,
  disabled,
  selected,
  onSelect,
  onPage,
}: {
  departmentId: string;
  teamId: string;
  filters: { search: string; page: number };
  disabled: boolean;
  selected: string;
  onSelect: (employee: DirectoryPerson) => void;
  onPage: (page: number) => void;
}) {
  const load = useCallback(
    (signal: AbortSignal) =>
      getDirectory("departments", departmentId, filters, signal),
    [departmentId, filters],
  );
  const resource = useOrganizationResource(load);
  return (
    <>
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!resource.loading && !resource.error && resource.data && (
        <>
          <fieldset
            disabled={disabled}
            className="max-h-80 space-y-2 overflow-y-auto"
          >
            <legend className="sr-only">
              Choose an employee from this department
            </legend>
            {resource.data.employees.map((employee) => (
              <label
                key={employee._id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm"
              >
                <input
                  type="radio"
                  name="team-candidate"
                  className="mt-1"
                  checked={selected === employee._id}
                  disabled={referenceId(employee.teamId) === teamId}
                  onChange={() => onSelect(employee)}
                />
                <span>
                  <span className="block font-semibold">
                    {directoryName(employee)} · {employee.employeeNumber}
                  </span>
                  <span className="mt-1 block text-slate-500">
                    {referenceId(employee.teamId) === teamId
                      ? "Already in this team"
                      : `Current team: ${referenceLabel(employee.teamId)}`}
                  </span>
                </span>
              </label>
            ))}
            {!resource.data.employees.length && (
              <p className="p-5 text-sm text-slate-500">
                {filters.search
                  ? "No department employees match your search."
                  : "There are no employees in this department yet."}
              </p>
            )}
          </fieldset>
          <ViewPagination
            pagination={resource.data.pagination}
            disabled={disabled}
            onPage={onPage}
          />
        </>
      )}
    </>
  );
}

export function AssignTeamMember({
  departmentId,
  teamId,
  onDone,
  onCancel,
}: {
  departmentId: string;
  teamId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [filters, setFilters] = useState({ search: "", page: 1 });
  const [selected, setSelected] = useState<DirectoryPerson | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function assign() {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await assignEmployeeTeam(selected._id, teamId);
      onDone();
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mb-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold">Assign employee to team</h2>
      <p className="mb-5 text-sm leading-6 text-slate-500">
        Only employees in this department can be assigned. If the employee is in
        another team, this replaces their current team membership. Their
        reporting manager stays unchanged.
      </p>
      <ViewFilters
        search={filters.search}
        disabled={busy}
        onSearch={(search) => {
          setFilters({ search, page: 1 });
          setSelected(null);
        }}
      />
      <CandidateRows
        key={JSON.stringify(filters)}
        departmentId={departmentId}
        teamId={teamId}
        filters={filters}
        disabled={busy}
        selected={selected?._id ?? ""}
        onSelect={setSelected}
        onPage={(page) => {
          setFilters({ ...filters, page });
          setSelected(null);
        }}
      />
      {selected && (
        <p className="mt-4 text-sm font-semibold">
          Assign {directoryName(selected)} to this team?
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          className={buttonClass}
          disabled={!selected || busy}
          onClick={() => void assign()}
        >
          {busy ? "Assigning..." : "Confirm assignment"}
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

export function RemoveTeamMember({
  employee,
  onDone,
  onCancel,
}: {
  employee: DirectoryPerson;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await assignEmployeeTeam(employee._id, null);
      onDone();
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-bold">
        Remove {directoryName(employee)} from this team?
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Their department and reporting manager will stay unchanged.
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
          onClick={() => void remove()}
        >
          {busy ? "Removing..." : "Remove from team"}
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
