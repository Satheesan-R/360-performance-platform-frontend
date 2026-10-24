"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getHierarchy } from "@/services/organization.service";
import {
  departmentKey,
  hierarchyRows,
  teamKey,
  visibleHierarchyRows,
} from "@/lib/organization-hierarchy";
import type { HierarchyEmployee } from "@/types/organization";
import {
  Field,
  inputClass,
  PageHeading,
  ResourceState,
  secondaryClass,
} from "./ui";
import ReportingManagerEditor from "./reporting-manager-editor";
import ReportingViews from "./reporting-views";

export default function ReportingHierarchy() {
  const resource = useOrganizationResource(getHierarchy);
  const [selected, setSelected] = useState<HierarchyEmployee | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    team: "",
  });
  const [mode, setMode] = useState<"hierarchy" | "table">("hierarchy");
  const [success, setSuccess] = useState("");
  const employees = resource.data ?? [];
  const graph = hierarchyRows(employees);
  const rows = visibleHierarchyRows(employees, filters);
  const issues = graph.filter((row) => row.disconnected).length;
  const knownIds = new Set(employees.map((employee) => employee._id));
  const managers = new Set(
    employees
      .map((employee) => employee.reportingManagerId)
      .filter((id): id is string => Boolean(id && knownIds.has(id))),
  );
  const topLevel = employees.filter(
    (employee) => !employee.reportingManagerId,
  ).length;
  const matched = rows.filter((row) => !row.contextOnly).length;
  const context = rows.length - matched;
  const filtered = Boolean(
    filters.search.trim() || filters.department || filters.team,
  );
  const departments = new Map<string, string>();
  const teams = new Map<string, string>();

  for (const employee of employees) {
    const department = departmentKey(employee);
    const team = teamKey(employee);
    if (department)
      departments.set(
        department,
        employee.departmentName || `Department ${department.slice(-6)}`,
      );
    if (team && (!filters.department || department === filters.department))
      teams.set(team, employee.teamName || `Team ${team.slice(-6)}`);
  }

  function edit(employee: HierarchyEmployee) {
    setSelected(employee);
    setSuccess("");
  }

  function saved() {
    setSelected(null);
    setSuccess("Reporting manager updated. The hierarchy has been refreshed.");
    void resource.reload();
  }

  return (
    <>
      <PageHeading
        title="Reporting Hierarchy"
        description="Manage who reports to whom across your departments and teams."
      >
        <button
          type="button"
          className={secondaryClass}
          disabled={resource.loading || Boolean(selected)}
          onClick={resource.reload}
        >
          Refresh hierarchy
        </button>
      </PageHeading>

      {success && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />

      {!resource.loading && !resource.error && (
        <>
          <section
            aria-label="Reporting summary"
            className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {(
              [
                ["Total employees", employees.length],
                ["Reporting managers", managers.size],
                ["Top-level employees", topLevel],
                ["Relationships to review", issues],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p
                  className={`mt-3 text-3xl font-bold tabular-nums ${label === "Relationships to review" && value > 0 ? "text-amber-700" : "text-slate-950"}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </section>

          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            These are saved employee-to-manager relationships. Department heads
            and team leads are assigned separately on the{" "}
            <Link
              href="/hr/organization/departments"
              className="font-semibold underline"
            >
              Departments
            </Link>{" "}
            and{" "}
            <Link
              href="/hr/organization/teams"
              className="font-semibold underline"
            >
              Teams
            </Link>{" "}
            pages.
          </div>

          {selected && (
            <ReportingManagerEditor
              key={selected._id}
              employee={selected}
              employees={employees}
              onSaved={saved}
              onCancel={() => setSelected(null)}
            />
          )}

          <fieldset
            disabled={Boolean(selected)}
            className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]"
          >
            <Field label="Search employees">
              <input
                type="search"
                maxLength={200}
                className={inputClass}
                value={filters.search}
                onChange={(event) =>
                  setFilters({ ...filters, search: event.target.value })
                }
                placeholder="Name, employee number, job title, department, or team"
              />
            </Field>
            <Field label="Department">
              <select
                className={inputClass}
                value={filters.department}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    department: event.target.value,
                    team: "",
                  })
                }
              >
                <option value="">All departments</option>
                {[...departments]
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([id, name]) => (
                    <option
                      key={id}
                      value={id}
                    >
                      {name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Team">
              <select
                className={inputClass}
                value={filters.team}
                onChange={(event) =>
                  setFilters({ ...filters, team: event.target.value })
                }
              >
                <option value="">All teams</option>
                {[...teams]
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([id, name]) => (
                    <option
                      key={id}
                      value={id}
                    >
                      {name}
                    </option>
                  ))}
              </select>
            </Field>
          </fieldset>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {matched} {filtered ? "matching" : "total"} employees
              {context > 0 ? ` · ${context} managers included for context` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {filtered && (
                <button
                  type="button"
                  className={secondaryClass}
                  disabled={Boolean(selected)}
                  onClick={() =>
                    setFilters({ search: "", department: "", team: "" })
                  }
                >
                  Clear filters
                </button>
              )}
              <div
                role="group"
                aria-label="Reporting view"
                className="flex gap-2"
              >
                {(["hierarchy", "table"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    disabled={Boolean(selected)}
                    className={`${secondaryClass} capitalize ${mode === value ? "border-blue-600 bg-blue-50 text-blue-700" : ""}`}
                    onClick={() => setMode(value)}
                  >
                    {value === "hierarchy" ? "Hierarchy view" : "Table view"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {issues > 0 && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              {issues} employees have a reporting chain with a missing manager
              or a cycle. Review their marked relationships.
            </p>
          )}

          {rows.length ? (
            <ReportingViews
              rows={rows}
              employees={employees}
              mode={mode}
              disabled={Boolean(selected)}
              onEdit={edit}
            />
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="font-semibold text-slate-900">
                {employees.length
                  ? "No matching employees"
                  : "No reporting relationships yet"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {employees.length
                  ? "Try another search, department, or team."
                  : "Add employees through onboarding, then assign their reporting managers here."}
              </p>
              {!employees.length && (
                <Link
                  className={`${secondaryClass} mt-5 inline-flex`}
                  href="/hr/onboarding"
                >
                  Go to Employee Onboarding
                </Link>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
