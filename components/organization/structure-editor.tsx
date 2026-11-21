"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import {
  directoryName,
  eligibleLeader,
  referenceId,
} from "@/lib/organization-views";
import {
  getDepartmentOptions,
  getEmployeeOptions,
  saveOrganizationStructure,
} from "@/services/organization-views.service";
import type {
  DepartmentRecord,
  StructureValues,
  TeamRecord,
} from "@/types/organization-views";
import {
  buttonClass,
  Field,
  inputClass,
  ResourceState,
  secondaryClass,
} from "./ui";

export default function StructureEditor({
  kind,
  record,
  departmentId,
  onSaved,
  onCancel,
}: {
  kind: "departments" | "teams";
  record?: DepartmentRecord | TeamRecord;
  departmentId?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<StructureValues>({
    name: record?.name ?? "",
    code: record?.code ?? "",
    description: record?.description ?? "",
    status: record?.status ?? "active",
    ...(kind === "departments"
      ? {
          headEmployeeId:
            record && "headEmployeeId" in record
              ? referenceId(record.headEmployeeId)
              : "",
        }
      : {
          departmentId:
            record && "departmentId" in record
              ? referenceId(record.departmentId)
              : (departmentId ?? ""),
          teamLeadEmployeeId:
            record && "teamLeadEmployeeId" in record
              ? referenceId(record.teamLeadEmployeeId)
              : "",
        }),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [employees, departments] = await Promise.all([
        getEmployeeOptions(signal),
        kind === "teams" ? getDepartmentOptions(signal) : Promise.resolve([]),
      ]);
      return { employees, departments };
    },
    [kind],
  );
  const options = useOrganizationResource(load);
  const noun = kind === "departments" ? "Department" : "Team";
  const leaderId =
    kind === "departments" ? draft.headEmployeeId : draft.teamLeadEmployeeId;
  const leaderRole =
    kind === "departments" ? "department manager" : "tech lead";
  const eligibleEmployees =
    options.data?.employees.filter((employee) =>
      eligibleLeader(employee, kind),
    ) ?? [];
  const invalidLeader = Boolean(
    leaderId &&
    options.data &&
    !eligibleEmployees.some((employee) => employee._id === leaderId),
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || options.loading || options.error) return;
    if (!draft.name.trim() || !draft.code.trim()) {
      setError("Name and code are required.");
      return;
    }
    if (invalidLeader) {
      setError(`Select a ${leaderRole} or choose Unassigned.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveOrganizationStructure(
        kind,
        {
          ...draft,
          name: draft.name.trim(),
          code: draft.code.trim(),
          ...(kind === "departments"
            ? { headEmployeeId: draft.headEmployeeId || null }
            : { teamLeadEmployeeId: draft.teamLeadEmployeeId || null }),
        },
        record?._id,
      );
      onSaved();
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="mb-5 text-lg font-bold">
        {record ? "Edit" : "Add"} {noun}
      </h2>
      <ResourceState
        loading={options.loading}
        error={options.error}
        retry={options.reload}
      />
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <fieldset
        disabled={saving || options.loading || Boolean(options.error)}
        className="grid gap-5 sm:grid-cols-2"
      >
        <Field label={`${noun} name *`}>
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
        <Field label={`${noun} code *`}>
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
              value={draft.departmentId}
              onChange={(event) =>
                setDraft({ ...draft, departmentId: event.target.value })
              }
            >
              <option value="">Choose department</option>
              {options.data?.departments
                .filter(
                  (item) =>
                    item.status === "active" || item._id === draft.departmentId,
                )
                .map((item) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.name}
                    {item.status === "inactive" ? " (Inactive)" : ""}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Field label={kind === "departments" ? "Department head" : "Team lead"}>
          <select
            className={inputClass}
            value={leaderId ?? ""}
            onChange={(event) =>
              setDraft({
                ...draft,
                [kind === "departments"
                  ? "headEmployeeId"
                  : "teamLeadEmployeeId"]: event.target.value,
              })
            }
          >
            <option value="">Unassigned</option>
            {eligibleEmployees.map((employee) => (
              <option
                key={employee._id}
                value={employee._id}
              >
                {directoryName(employee)} ·{" "}
                {employee.employeeNumber || employee.workEmail}
              </option>
            ))}
            {invalidLeader && (
              <option
                value={leaderId!}
                disabled
                hidden
              >
                Choose a {leaderRole}
              </option>
            )}
          </select>
          {invalidLeader && (
            <span className="block text-xs font-normal text-amber-700">
              The current assignment does not match the required role. Select a{" "}
              {leaderRole} or choose Unassigned.
            </span>
          )}
          {!options.loading &&
            !options.error &&
            eligibleEmployees.length === 0 && (
              <span className="block text-xs font-normal text-slate-500">
                No employees with the {leaderRole} role are available.
              </span>
            )}
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={draft.status}
            onChange={(event) =>
              setDraft({
                ...draft,
                status: event.target.value as StructureValues["status"],
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
      </fieldset>
      {kind === "teams" && record && (
        <p className="mt-4 text-xs text-slate-500">
          Remove or reassign members before moving this team to another
          department.
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          className={secondaryClass}
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={buttonClass}
          disabled={saving || options.loading || Boolean(options.error)}
        >
          {saving ? "Saving..." : `Save ${noun}`}
        </button>
      </div>
    </form>
  );
}
