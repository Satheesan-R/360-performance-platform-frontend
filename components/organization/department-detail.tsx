"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { personLabel } from "@/lib/organization-views";
import { getDepartment, getDepartmentMembers } from "@/services/organization-views.service";
import { ResourceState, secondaryClass, Status } from "./ui";
import { DeactivateDepartment } from "./structure-directory";
import StructureEditor from "./structure-editor";
import DepartmentTree from "./department-tree";
import EmployeeDepartment from "./employee-department";
import DepartmentMemberViews from "./department-member-views";
import type { DirectoryPerson } from "@/types/organization-views";

const departmentTabs = ["overview", "teams", "employees", "hierarchy"] as const;

export default function DepartmentDetail({ id }: { id: string }) {
  const load = useCallback(
    (signal: AbortSignal) => getDepartment(id, signal),
    [id],
  );
  const details = useOrganizationResource(load);
  const loadMembers = useCallback((signal: AbortSignal) => getDepartmentMembers(id, signal), [id]);
  const members = useOrganizationResource(loadMembers);
  const [tab, setTab] = useState<(typeof departmentTabs)[number]>("overview");
  const [teamFilter, setTeamFilter] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [message, setMessage] = useState("");
  const [moving, setMoving] = useState<DirectoryPerson | null>(null);
  const department = details.data;
  const locked = editing || deactivating || Boolean(moving) || addingTeam;
  function changed(message: string) {
    setEditing(false);
    setDeactivating(false);
    setMoving(null);
    setAddingTeam(false);
    setMessage(message);
    void details.reload();
    void members.reload();
  }
  return (
    <>
      <Link
        href="/hr/organization/departments"
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <span aria-hidden="true">←</span>
        Back to departments
      </Link>
      <ResourceState
        loading={details.loading}
        error={details.error}
        retry={details.reload}
      />
      {!details.loading && !details.error && department && (
        <>
          <header className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.65fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-xl bg-blue-50 text-3xl text-blue-700">▥</span>
              <div className="min-w-0">
                <h1 className="wrap-break-word text-3xl font-bold tracking-tight text-slate-950">{department.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>{department.code}</span>
                  <Status value={department.status} />
                </div>
                {department.description && <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-slate-600">{department.description}</p>}
              </div>
            </div>
            <dl className="border-slate-200 lg:border-l lg:pl-5">
              <dt className="text-sm text-slate-600">Department head</dt>
              <dd className="mt-1 font-semibold text-slate-950">{personLabel(department.headEmployeeId)}</dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={locked} className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50" onClick={() => setEditing(true)}>
                Edit department
              </button>
              {department.status === "active" && (
                <button type="button" className={secondaryClass} disabled={locked} onClick={() => setDeactivating(true)}>
                  Deactivate
                </button>
              )}
            </div>
          </header>
          {message && (
            <p
              role="status"
              className="my-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {message}
            </p>
          )}
          {editing && (
            <StructureEditor
              kind="departments"
              record={department}
              onSaved={() => changed("Department saved.")}
              onCancel={() => setEditing(false)}
            />
          )}
          {deactivating && (
            <DeactivateDepartment
              department={department}
              onDone={() =>
                changed(
                  "Department deactivated. All relationships are retained.",
                )
              }
              onCancel={() => setDeactivating(false)}
            />
          )}
          <div
            className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-300"
            role="group"
            aria-label="Department views"
          >
            {departmentTabs.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={tab === value}
                disabled={locked}
                className={`shrink-0 border-b-2 px-4 py-3.5 text-sm font-bold capitalize focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 ${tab === value ? "border-blue-600 text-blue-700" : "border-transparent text-slate-700 hover:text-blue-700"}`}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {tab !== "hierarchy" && (
            <div className="space-y-5">
              {addingTeam && (
                <StructureEditor kind="teams" departmentId={id} onSaved={() => changed("Team added.")} onCancel={() => setAddingTeam(false)} />
              )}
              {moving && (
                <EmployeeDepartment employee={moving} currentDepartmentId={id} onDone={() => changed("Employee department saved. Counts refreshed.")} onCancel={() => setMoving(null)} />
              )}
              <ResourceState loading={members.loading} error={members.error} retry={members.reload} />
              {!members.loading && !members.error && members.data && (
                <DepartmentMemberViews
                  tab={tab}
                  name={department.name}
                  teams={members.data.teams}
                  employees={members.data.employees}
                  teamFilter={teamFilter}
                  onSelectTeam={setTeamFilter}
                  onViewTeams={() => setTab("teams")}
                  onViewEmployees={(teamId) => { setTeamFilter(teamId); setTab("employees"); }}
                  onAddTeam={() => setAddingTeam(true)}
                  onMoveEmployee={setMoving}
                  disabled={locked}
                />
              )}
            </div>
          )}
          {tab === "hierarchy" && <DepartmentTree id={id} />}
        </>
      )}
    </>
  );
}
