"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { directoryName, personLabel, referenceId } from "@/lib/organization-views";
import type { DirectoryPerson, TeamRecord } from "@/types/organization-views";
import { inputClass, secondaryClass, Status } from "./ui";
import { ActionIcon, viewActionClass, viewCellClass, viewHeadClass } from "./view-controls";

const previewLimit = 3;
const panelClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const linkClass = "text-sm font-semibold text-blue-700 hover:underline";
const employeeId = (employee: DirectoryPerson) => encodeURIComponent(employee._id);

function Badge({ label }: { label: "team" | "employee" }) {
  return <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-lg leading-none text-blue-700">{label === "team" ? "♧" : "♙"}</span>;
}

function MemberTable({ title, columns, children }: { title: string; columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg">
      <table aria-label={title} className="w-full min-w-[34rem] text-left text-sm">
        <thead className="border-b border-slate-200 bg-blue-50">
          <tr>{columns.map((label) => <th key={label} scope="col" className={viewHeadClass}>{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function EmployeeRows({ employees, teamNames, onMove, disabled }: {
  employees: DirectoryPerson[];
  teamNames: Map<string, string>;
  onMove?: (employee: DirectoryPerson) => void;
  disabled?: boolean;
}) {
  const columns = ["Employee", "Job title", "Team", ...(onMove ? ["Status", "Actions"] : [])];
  return (
    <MemberTable title="Department employees" columns={columns}>
      {employees.map((employee) => {
        const name = directoryName(employee);
        const href = `/hr/onboarding/${employeeId(employee)}`;
        const status = employee.user?.status === "disabled" ? "Disabled"
          : employee.user?.status === "active" || employee.onboardingStatus === "completed" ? "Active" : "Pending";

        return (
          <tr key={employee._id}>
            <th scope="row" className={viewCellClass}>
              <div className="flex items-center gap-3">
                <Badge label="employee" />
                <div>
                  <Link href={href} className="font-semibold text-slate-900 hover:text-blue-700 hover:underline">{name}</Link>
                  {employee.employeeNumber && <p className="mt-0.5 text-xs font-normal text-slate-500">{employee.employeeNumber}</p>}
                </div>
              </div>
            </th>
            <td className={viewCellClass}>{employee.jobTitle || "—"}</td>
            <td className={viewCellClass}>{teamNames.get(referenceId(employee.teamId)) ?? "Unassigned"}</td>
            {onMove && (
              <>
                <td className={viewCellClass}>
                  {status === "Active" ? <Status value="active" /> : (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status === "Disabled" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-800"}`}>{status}</span>
                  )}
                </td>
                <td className={viewCellClass}>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Link href={href} className="rounded-lg border border-blue-200 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-50">View profile</Link>
                    <button type="button" title="Change department" aria-label={`Change department for ${name}`} disabled={disabled} className={viewActionClass} onClick={() => onMove(employee)}>
                      <ActionIcon action="edit" />
                    </button>
                  </div>
                </td>
              </>
            )}
          </tr>
        );
      })}
      {!employees.length && <tr><td colSpan={columns.length} className="px-5 py-6 text-sm text-slate-600">No employees to display.</td></tr>}
    </MemberTable>
  );
}

export default function DepartmentMemberViews({
  tab, name, teams, employees, teamFilter, onSelectTeam, onViewTeams, onViewEmployees, onAddTeam, onMoveEmployee, disabled,
}: {
  tab: "overview" | "teams" | "employees";
  name: string;
  teams: TeamRecord[];
  employees: DirectoryPerson[];
  teamFilter: string;
  onSelectTeam: (id: string) => void;
  onViewTeams: () => void;
  onViewEmployees: (teamId: string) => void;
  onAddTeam: () => void;
  onMoveEmployee: (employee: DirectoryPerson) => void;
  disabled: boolean;
}) {
  const [teamSearch, setTeamSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const teamNames = new Map(teams.map((team) => [team._id, team.name]));
  const teamCounts = new Map<string, number>();
  for (const employee of employees) {
    const id = referenceId(employee.teamId);
    if (teamNames.has(id)) teamCounts.set(id, (teamCounts.get(id) ?? 0) + 1);
  }

  if (tab === "teams") {
    const query = teamSearch.trim().toLowerCase();
    const matching = teams.filter((team) => `${team.name} ${team.code} ${personLabel(team.teamLeadEmployeeId)}`.toLowerCase().includes(query));
    return (
      <section className={panelClass} aria-labelledby="department-teams-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="department-teams-heading" className="flex items-center gap-3 text-xl font-bold text-slate-950"><Badge label="team" />{name} teams</h2>
          <button type="button" className={secondaryClass} disabled={disabled} onClick={onAddTeam}>Add team</button>
        </div>
        <input type="search" aria-label="Search teams" placeholder="Search teams" className={`${inputClass} mb-4 max-w-sm`} value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} />
        <MemberTable title={`${name} teams`} columns={["Team", "Team lead", "Members", "Status", "Action"]}>
          {matching.map((team) => (
            <tr key={team._id}>
              <th scope="row" className={viewCellClass}>
                <Link href={`/hr/organization/teams/${encodeURIComponent(team._id)}`} className="font-semibold text-slate-900 hover:text-blue-700 hover:underline">{team.name}</Link>
              </th>
              <td className={viewCellClass}>{personLabel(team.teamLeadEmployeeId)}</td>
              <td className={`${viewCellClass} tabular-nums`}>{teamCounts.get(team._id) ?? 0}</td>
              <td className={viewCellClass}><Status value={team.status} /></td>
              <td className={viewCellClass}>
                <button type="button" className={`${linkClass} whitespace-nowrap`} aria-label={`View members of ${team.name}`} disabled={disabled} onClick={() => {
                  setEmployeeSearch("");
                  onViewEmployees(team._id);
                }}>View members</button>
              </td>
            </tr>
          ))}
          {!matching.length && <tr><td colSpan={5} className="px-5 py-6 text-sm text-slate-600">{query ? "No teams match your search." : "No teams in this department."}</td></tr>}
        </MemberTable>
      </section>
    );
  }

  const selectedTeam = teamNames.has(teamFilter) ? teamFilter : "";
  const query = employeeSearch.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) =>
    (!selectedTeam || referenceId(employee.teamId) === selectedTeam)
    && `${directoryName(employee)} ${employee.employeeNumber ?? ""} ${employee.jobTitle ?? ""} ${employee.workEmail ?? ""}`.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-5">
      <dl aria-label="Department statistics" className="grid gap-4 sm:grid-cols-2">
        {([
          { label: "Teams", count: teams.length, icon: "team" },
          { label: "Employees", count: employees.length, icon: "employee" },
        ] as const).map(({ label, count, icon }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Badge label={icon} />
            <div>
              <dt className="text-sm font-semibold text-slate-600">{label}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{count.toLocaleString()}</dd>
            </div>
          </div>
        ))}
      </dl>

      {tab === "overview" ? (
        <>
          <section className={panelClass} aria-labelledby="department-teams-preview">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="department-teams-preview" className="text-xl font-bold text-slate-950">Teams</h2>
              <button type="button" className={linkClass} disabled={disabled} onClick={onViewTeams}>View all teams</button>
            </div>
            {teams.length ? (
              <ul className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
                {teams.slice(0, previewLimit).map((team) => (
                  <li key={team._id} className="flex items-center gap-3 px-2 py-2 text-sm font-semibold text-slate-900">
                    <Badge label="team" />{team.name}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-slate-600">No teams in this department.</p>}
          </section>
          <section className={panelClass} aria-labelledby="department-employees-preview">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="department-employees-preview" className="text-xl font-bold text-slate-950">Employees</h2>
              <button type="button" className={linkClass} disabled={disabled} onClick={() => {
                setEmployeeSearch("");
                onViewEmployees("");
              }}>View all employees</button>
            </div>
            <EmployeeRows employees={employees.slice(0, previewLimit)} teamNames={teamNames} />
          </section>
        </>
      ) : (
        <section className={panelClass} aria-labelledby="department-employees-heading">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h2 id="department-employees-heading" className="text-xl font-bold text-slate-950">{name} employees</h2>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <input type="search" aria-label="Search employees" placeholder="Search employees" className={inputClass} value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} />
              <select aria-label="Filter by team" className={inputClass} value={selectedTeam} onChange={(event) => onSelectTeam(event.target.value)}>
                <option value="">All teams</option>
                {teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}
              </select>
            </div>
          </div>
          <EmployeeRows employees={filteredEmployees} teamNames={teamNames} onMove={onMoveEmployee} disabled={disabled} />
        </section>
      )}
    </div>
  );
}
