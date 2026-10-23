"use client";

import { useState, type FormEvent } from "react";
import { reportingManagerChoices } from "@/lib/organization-hierarchy";
import { getApiErrorMessage } from "@/lib/api";
import { updateReportingManager } from "@/services/organization.service";
import type { HierarchyEmployee } from "@/types/organization";
import { buttonClass, Field, inputClass, secondaryClass } from "./ui";

export default function ReportingManagerEditor({ employee, employees, onSaved, onCancel }: {
  employee: HierarchyEmployee; employees: HierarchyEmployee[];
  onSaved: () => void; onCancel: () => void;
}) {
  const candidates = reportingManagerChoices(employees, employee._id);
  const validCurrent = candidates.some((candidate) => candidate._id === employee.reportingManagerId);
  const [managerId, setManagerId] = useState(validCurrent ? employee.reportingManagerId ?? "" : "");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const currentName = employees.find((candidate) => candidate._id === employee.reportingManagerId)?.fullName
    || employee.reportingManagerName || (employee.reportingManagerId ? "Manager unavailable" : "No manager (top level)");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (managerId && !candidates.some((candidate) => candidate._id === managerId)) {
      setError("Choose a valid manager outside this employee's reporting chain.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateReportingManager(employee._id, managerId || null);
      onSaved();
    } catch (error) { setError(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="mb-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold">Change manager for {employee.fullName}</h2>
      <p className="mt-2 text-sm text-slate-500">{[employee.employeeNumber, employee.designation, employee.departmentName, employee.teamName].filter(Boolean).join(" · ")}</p>
      <p className="mb-5 mt-3 text-sm text-slate-600">Current manager: {currentName}</p>

      {employee.reportingManagerId && !validCurrent && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">The current reporting chain needs review. Choose an eligible manager or save with no manager to make this employee top level.</p>}
      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
        <Field label="Find a manager">
          <input autoFocus type="search" className={inputClass} maxLength={200} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, employee number, department, or team" />
        </Field>
        <Field label="Reporting manager">
          <select className={inputClass} value={managerId} onChange={(event) => setManagerId(event.target.value)}>
            <option value="">No manager (top level)</option>
            {candidates.filter((candidate) => candidate._id === managerId || `${candidate.fullName} ${candidate.employeeNumber ?? ""} ${candidate.departmentName ?? ""} ${candidate.teamName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())).map((candidate) => (
              <option key={candidate._id} value={candidate._id}>
                {candidate.fullName}{candidate.employeeNumber ? ` (${candidate.employeeNumber})` : ""}{candidate.departmentName ? ` · ${candidate.departmentName}` : ""}{candidate.teamName ? ` / ${candidate.teamName}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <p className="mt-4 text-xs leading-6 text-slate-500">The employee, their direct or indirect reports, and employees with invalid reporting chains cannot be selected. This changes only the reporting manager; department, team, head, and lead assignments stay unchanged.</p>
      <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button type="button" className={secondaryClass} disabled={saving} onClick={onCancel}>Cancel</button>
        <button type="submit" className={buttonClass} disabled={saving}>{saving ? "Saving..." : "Save reporting manager"}</button>
      </div>
    </form>
  );
}
