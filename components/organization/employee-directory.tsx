"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { directoryName, personLabel, referenceId, referenceLabel } from "@/lib/organization-views";
import { getDirectory } from "@/services/organization-views.service";
import type { DirectoryPerson } from "@/types/organization-views";
import { ResourceState } from "./ui";
import { ViewFilters, ViewPagination, viewActionClass, viewCellClass, viewHeadClass, viewTableClass } from "./view-controls";

function EmployeeRows({ kind, id, filters, disabled, onRemove, onPage }: {
  kind: "departments" | "teams"; id: string; filters: { search: string; page: number }; disabled?: boolean;
  onRemove?: (employee: DirectoryPerson) => void; onPage: (page: number) => void;
}) {
  const load = useCallback((signal: AbortSignal) => getDirectory(kind, id, filters, signal), [kind, id, filters]);
  const resource = useOrganizationResource(load);
  const data = resource.data;
  return <>
    <ResourceState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!resource.loading && !resource.error && data && <>
      {!data.employees.length ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h3 className="font-semibold">No employees found</h3><p className="mt-2 text-sm text-slate-500">{filters.search ? "Try another name, employee number, email, or job title." : `No employees are assigned to this ${kind === "departments" ? "department" : "team"} yet.`}</p></div> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className={viewTableClass}>
          <thead className="bg-slate-50/80"><tr>{["Employee", "Employee number", "Work email", "Job title", "Team", "Manager", "Account", "Onboarding", ...(onRemove ? ["Actions"] : [])].map((heading) => <th key={heading} scope="col" className={viewHeadClass}>{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{data.employees.map((employee) => <tr key={employee._id} className="hover:bg-blue-50/40">
            <td className={`${viewCellClass} font-semibold text-slate-900`}>{directoryName(employee)}</td>
            <td className={viewCellClass}>{employee.employeeNumber || "—"}</td>
            <td className={viewCellClass}>{employee.workEmail || "—"}</td>
            <td className={viewCellClass}>{employee.jobTitle || "—"}</td>
            <td className={viewCellClass}>{referenceId(employee.teamId) ? <Link href={`/hr/organization/teams/${referenceId(employee.teamId)}`} className="text-blue-700 hover:underline">{referenceLabel(employee.teamId)}</Link> : "Unassigned"}</td>
            <td className={viewCellClass}>{personLabel(employee.managerId)}</td>
            <td className={viewCellClass}><p>{employee.user?.role?.replaceAll("_", " ") || "—"}</p><p className="mt-1 text-xs text-slate-500">{employee.user?.status || "No account information"}</p></td>
            <td className={`${viewCellClass} capitalize`}>{employee.onboardingStatus || "—"}</td>
            {onRemove && <td className={viewCellClass}><button type="button" className={`${viewActionClass} whitespace-nowrap text-red-700`} disabled={disabled} onClick={() => onRemove(employee)}>Remove from team</button></td>}
          </tr>)}</tbody>
        </table>
      </div>}
      <ViewPagination pagination={data.pagination} disabled={disabled} onPage={onPage} />
    </>}
  </>;
}

export default function EmployeeDirectory({ kind, id, disabled, onRemove, revision = 0 }: {
  kind: "departments" | "teams"; id: string; disabled?: boolean;
  onRemove?: (employee: DirectoryPerson) => void; revision?: number;
}) {
  const [filters, setFilters] = useState({ search: "", page: 1 });
  return <>
    <ViewFilters search={filters.search} disabled={disabled} onSearch={(search) => setFilters({ search, page: 1 })} />
    <EmployeeRows key={`${JSON.stringify(filters)}:${revision}`} kind={kind} id={id} filters={filters} disabled={disabled} onRemove={onRemove} onPage={(page) => setFilters({ ...filters, page })} />
  </>;
}
