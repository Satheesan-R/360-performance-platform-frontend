"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { directoryName, personLabel } from "@/lib/organization-views";
import { getDepartmentTree } from "@/services/organization-views.service";
import type { DirectoryPerson } from "@/types/organization-views";
import { ResourceState, Status } from "./ui";
import { ViewFilters } from "./view-controls";

export function TreeEmployees({
  employees,
  search,
}: {
  employees: DirectoryPerson[];
  search: string;
}) {
  const matches = employees.filter((employee) =>
    `${directoryName(employee)} ${employee.employeeNumber ?? ""} ${employee.workEmail ?? ""} ${employee.jobTitle ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {matches.map((employee) => (
        <article
          key={employee._id}
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
        >
          <h4 className="font-semibold">{directoryName(employee)}</h4>
          <p className="mt-1 text-xs text-slate-500">
            {employee.employeeNumber} · {employee.jobTitle || "No job title"}
          </p>
          <p className="mt-2 break-all text-xs text-slate-500">
            {employee.workEmail}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Manager: {personLabel(employee.managerId)}
          </p>
          {employee.unassignedReason === "team-not-in-department" && (
            <p className="mt-3 text-xs font-semibold text-amber-700">
              Team reference is outside this department or unavailable. Reassign
              the employee to a valid team.
            </p>
          )}
        </article>
      ))}
      {!matches.length && (
        <p className="text-sm text-slate-500">
          {employees.length
            ? "No employees match this search."
            : "No employees in this group."}
        </p>
      )}
    </div>
  );
}

export default function DepartmentTree({ id }: { id: string }) {
  const load = useCallback(
    (signal: AbortSignal) => getDepartmentTree(id, signal),
    [id],
  );
  const resource = useOrganizationResource(load);
  const [search, setSearch] = useState("");
  const tree = resource.data;
  return (
    <>
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!resource.loading && !resource.error && tree && (
        <>
          <h2 className="mb-2 text-xl font-bold">
            {tree.department.name} hierarchy
          </h2>
          <p className="mb-5 text-sm text-slate-500">
            {tree.summary.teamCount} teams · {tree.summary.employeeCount}{" "}
            employees · {tree.summary.unassignedEmployeeCount} without a valid
            team. Includes inactive and empty teams.
          </p>
          <ViewFilters
            search={search}
            onSearch={setSearch}
          />
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="font-bold">{tree.department.name}</h3>
            <p className="mt-2 text-sm text-slate-600">
              Department head: {personLabel(tree.department.headEmployeeId)}
            </p>
          </div>
          <div className="space-y-5 border-l-2 border-slate-200 pl-4 sm:pl-6">
            {tree.teams.map((team) => (
              <details
                key={team._id}
                open
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <summary className="cursor-pointer text-sm font-semibold">
                  <span>
                    {team.name} · {team.employeeCount} employees
                  </span>
                  <span className="ml-3 inline-flex">
                    <Status value={team.status} />
                  </span>
                </summary>
                <div className="mt-3 flex flex-wrap justify-between gap-3 text-sm">
                  <p className="text-slate-500">
                    Team lead: {personLabel(team.teamLeadEmployeeId)}
                  </p>
                  <Link
                    className="font-semibold text-blue-700 hover:underline"
                    href={`/hr/organization/teams/${team._id}`}
                  >
                    View team
                  </Link>
                </div>
                <TreeEmployees
                  employees={team.employees}
                  search={search}
                />
              </details>
            ))}
            {!tree.teams.length && (
              <p className="text-sm text-slate-500">
                No teams have been created in this department.
              </p>
            )}
            <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5">
              <h3 className="font-semibold">
                Employees without a team ({tree.unassignedEmployees.length})
              </h3>
              <TreeEmployees
                employees={tree.unassignedEmployees}
                search={search}
              />
            </section>
          </div>
        </>
      )}
    </>
  );
}
