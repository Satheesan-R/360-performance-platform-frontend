"use client";

import Link from "next/link";
import type { visibleHierarchyRows } from "@/lib/organization-hierarchy";
import type { HierarchyEmployee } from "@/types/organization";
import { secondaryClass } from "./ui";
import { viewCellClass, viewHeadClass, viewTableClass } from "./view-controls";

type ReportingRows = ReturnType<typeof visibleHierarchyRows>;
const indentation = ["sm:ml-0", "sm:ml-6", "sm:ml-12", "sm:ml-18", "sm:ml-24"];

function DepartmentLabel({ employee }: { employee: HierarchyEmployee }) {
  return employee.departmentId ? (
    <Link
      className="text-blue-700 hover:underline"
      href={`/hr/organization/departments/${employee.departmentId}`}
    >
      {employee.departmentName || "View department"}
    </Link>
  ) : (
    <span>{employee.departmentName || "No department"}</span>
  );
}
function TeamLabel({ employee }: { employee: HierarchyEmployee }) {
  return employee.teamId ? (
    <Link
      className="text-blue-700 hover:underline"
      href={`/hr/organization/teams/${employee.teamId}`}
    >
      {employee.teamName || "View team"}
    </Link>
  ) : (
    <span>{employee.teamName || "No team"}</span>
  );
}

export default function ReportingViews({
  rows,
  employees,
  mode,
  disabled,
  onEdit,
}: {
  rows: ReportingRows;
  employees: HierarchyEmployee[];
  mode: "hierarchy" | "table";
  disabled: boolean;
  onEdit: (employee: HierarchyEmployee) => void;
}) {
  const byId = new Map(employees.map((employee) => [employee._id, employee]));
  const directReports = new Map<string, number>();
  for (const employee of employees)
    if (employee.reportingManagerId)
      directReports.set(
        employee.reportingManagerId,
        (directReports.get(employee.reportingManagerId) ?? 0) + 1,
      );
  const managerName = (employee: HierarchyEmployee) =>
    employee.reportingManagerId
      ? byId.get(employee.reportingManagerId)?.fullName ||
        employee.reportingManagerName ||
        "Manager unavailable"
      : "No manager (top level)";
  const edit = (employee: HierarchyEmployee) => (
    <button
      type="button"
      className={`${secondaryClass} whitespace-nowrap`}
      disabled={disabled}
      aria-label={`Change manager for ${employee.fullName}`}
      onClick={() => onEdit(employee)}
    >
      Change manager
    </button>
  );

  if (mode === "table")
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className={viewTableClass}>
          <thead className="bg-slate-50/80">
            <tr>
              {[
                "Employee",
                "Job title",
                "Department",
                "Team",
                "Reports to",
                "Direct reports",
                "Actions",
              ].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className={viewHeadClass}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ employee, disconnected, contextOnly }) => (
              <tr
                key={employee._id}
                className="hover:bg-blue-50/40"
              >
                <td className={viewCellClass}>
                  <p className="font-semibold text-slate-900">
                    {employee.fullName}
                  </p>
                  <p className="mt-1 text-xs">{employee.employeeNumber}</p>
                  {contextOnly && (
                    <p className="mt-1 text-xs text-blue-600">
                      Manager context
                    </p>
                  )}
                  {disconnected && (
                    <p className="mt-1 text-xs font-semibold text-amber-700">
                      Review reporting relationship
                    </p>
                  )}
                </td>
                <td className={viewCellClass}>{employee.designation || "—"}</td>
                <td className={viewCellClass}>
                  <DepartmentLabel employee={employee} />
                </td>
                <td className={viewCellClass}>
                  <TeamLabel employee={employee} />
                </td>
                <td className={viewCellClass}>{managerName(employee)}</td>
                <td className={viewCellClass}>
                  {directReports.get(employee._id) ?? 0}
                </td>
                <td className={viewCellClass}>{edit(employee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <ol
      aria-label="Employee reporting relationships"
      className="space-y-4"
    >
      {rows.map(({ employee, depth, disconnected, contextOnly }) => (
        <li
          key={employee._id}
          className={indentation[Math.min(depth, indentation.length - 1)]}
        >
          <article
            className={`rounded-2xl border border-l-4 bg-white p-5 shadow-sm ${disconnected ? "border-amber-200 border-l-amber-500" : depth === 0 ? "border-slate-200 border-l-slate-800" : "border-slate-200 border-l-blue-500"}`}
          >
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div className="flex min-w-0 items-start gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700"
                >
                  {employee.fullName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((name) => name[0])
                    .join("")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words font-bold text-slate-950">
                      {employee.fullName}
                    </h3>
                    {contextOnly && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                        Manager context
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {[employee.employeeNumber, employee.designation]
                      .filter(Boolean)
                      .join(" · ") || "Employee"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <DepartmentLabel employee={employee} />
                    <TeamLabel employee={employee} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-500">
                  Level {depth + 1} · {directReports.get(employee._id) ?? 0}{" "}
                  direct reports
                </span>
                {edit(employee)}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
              Reports to:{" "}
              <span className="font-semibold text-slate-800">
                {managerName(employee)}
              </span>
            </div>
            {disconnected && (
              <p className="mt-2 text-xs font-semibold text-amber-700">
                This chain contains a missing manager or circular relationship.
                Review the reporting assignment.
              </p>
            )}
          </article>
        </li>
      ))}
    </ol>
  );
}
