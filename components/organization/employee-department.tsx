"use client";

import { useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import { directoryName } from "@/lib/organization-views";
import {
  assignEmployeeDepartment,
  getDepartmentOptions,
} from "@/services/organization-views.service";
import type { DirectoryPerson } from "@/types/organization-views";
import {
  buttonClass,
  Field,
  inputClass,
  ResourceState,
  secondaryClass,
} from "./ui";

export default function EmployeeDepartment({
  employee,
  currentDepartmentId,
  onDone,
  onCancel,
}: {
  employee: DirectoryPerson;
  currentDepartmentId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const options = useOrganizationResource(getDepartmentOptions);
  const [departmentId, setDepartmentId] = useState(currentDepartmentId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (busy || options.loading || options.error) return;
    setBusy(true);
    setError("");
    try {
      await assignEmployeeDepartment(employee._id, departmentId || null);
      onDone();
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mb-6 rounded-2xl border border-blue-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-bold">
        Change department for {directoryName(employee)}
      </h2>
      <ResourceState
        loading={options.loading}
        error={options.error}
        retry={options.reload}
      />
      <fieldset disabled={busy || options.loading || Boolean(options.error)}>
        <Field label="Department">
          <select
            className={inputClass}
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
          >
            <option value="">No department</option>
            {options.data
              ?.filter(
                (item) =>
                  item.status === "active" || item._id === currentDepartmentId,
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
      </fieldset>
      <p className="mt-3 text-sm text-slate-600">
        Changing or clearing the department also clears incompatible team
        membership. Keeping the same department preserves their team. The
        reporting manager stays unchanged.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          className={buttonClass}
          disabled={busy || options.loading || Boolean(options.error)}
          onClick={() => void save()}
        >
          {busy ? "Saving..." : "Confirm department change"}
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
