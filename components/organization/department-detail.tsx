"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { directoryName, personLabel } from "@/lib/organization-views";
import { getDepartment, getDepartmentMembers } from "@/services/organization-views.service";
import { PageHeading, ResourceState, secondaryClass, Status } from "./ui";
import EmployeeDirectory from "./employee-directory";
import StructureDirectory, {
  DeactivateDepartment,
} from "./structure-directory";
import StructureEditor from "./structure-editor";
import DepartmentTree from "./department-tree";
import EmployeeDepartment from "./employee-department";
import type { DepartmentRecord, DirectoryPerson } from "@/types/organization-views";

function DepartmentOverview({ department }: { department: DepartmentRecord }) {
  const load = useCallback(
    (signal: AbortSignal) => getDepartmentMembers(department._id, signal),
    [department._id],
  );
  const members = useOrganizationResource(load);
  const data = members.data;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Department overview</h2>
          <Status value={department.status} />
        </div>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Department head</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{personLabel(department.headEmployeeId)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{department.description || "No description"}</dd>
          </div>
        </dl>
      </section>

      <ResourceState loading={members.loading} error={members.error} retry={members.reload} />
      {!members.loading && !members.error && data && (
        <>
          <dl aria-label="Department statistics" className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Total teams", count: data.teams.length },
              { label: "Total employees", count: data.employees.length },
            ].map(({ label, count }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <dt className="text-sm font-semibold text-slate-600">{label}</dt>
                <dd className="mt-2 text-3xl font-bold tabular-nums text-blue-700">{count.toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <section aria-labelledby="department-teams" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h2 id="department-teams" className="border-b border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-900">Teams</h2>
              {data.teams.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.teams.map((team) => <li key={team._id} className="px-5 py-3 text-sm font-semibold text-slate-900">{team.name}</li>)}
                </ul>
              ) : <p className="p-5 text-sm text-slate-600">No teams in this department.</p>}
            </section>
            <section aria-labelledby="department-employees" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h2 id="department-employees" className="border-b border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-900">Employees</h2>
              {data.employees.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.employees.map((employee) => (
                    <li key={employee._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                      <Link href={`/hr/onboarding/${encodeURIComponent(employee._id)}`} className="font-semibold text-blue-700 hover:underline">{directoryName(employee)}</Link>
                      <span className="text-slate-600">{employee.employeeNumber || "Employee number unavailable"}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="p-5 text-sm text-slate-600">No employees in this department.</p>}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default function DepartmentDetail({ id }: { id: string }) {
  const load = useCallback(
    (signal: AbortSignal) => getDepartment(id, signal),
    [id],
  );
  const details = useOrganizationResource(load);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [message, setMessage] = useState("");
  const [moving, setMoving] = useState<DirectoryPerson | null>(null);
  const department = details.data;
  const locked = editing || deactivating || Boolean(moving);
  function changed(message: string) {
    setEditing(false);
    setDeactivating(false);
    setMoving(null);
    setMessage(message);
    void details.reload();
  }
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex flex-wrap gap-2 text-sm text-slate-500"
      >
        <Link
          href="/hr/organization"
          className="hover:text-blue-700"
        >
          Organization
        </Link>
        <span>/</span>
        <Link
          href="/hr/organization/departments"
          className="hover:text-blue-700"
        >
          Departments
        </Link>
        <span>/</span>
        <span>{department?.name || "Department"}</span>
      </nav>
      <ResourceState
        loading={details.loading}
        error={details.error}
        retry={details.reload}
      />
      {!details.loading && !details.error && department && (
        <>
          <PageHeading
            title={department.name}
            description={department.code}
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryClass}
                disabled={locked}
                onClick={() => setEditing(true)}
              >
                Edit Department
              </button>
              {department.status === "active" && (
                <button
                  type="button"
                  className={secondaryClass}
                  disabled={locked}
                  onClick={() => setDeactivating(true)}
                >
                  Deactivate
                </button>
              )}
            </div>
          </PageHeading>
          {message && (
            <p
              role="status"
              className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
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
            className="mb-6 flex gap-2 overflow-x-auto"
            role="group"
            aria-label="Department views"
          >
            {["overview", "teams", "employees", "hierarchy"].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={tab === value}
                disabled={locked}
                className={`${secondaryClass} capitalize ${tab === value ? "border-blue-600 bg-blue-50 text-blue-700" : ""}`}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {tab === "overview" && <DepartmentOverview department={department} />}
          {tab === "teams" && (
            <StructureDirectory
              kind="teams"
              departmentId={id}
              onChanged={() => void details.reload()}
            />
          )}
          {tab === "employees" && (
            <>
              {moving && (
                <EmployeeDepartment
                  employee={moving}
                  currentDepartmentId={id}
                  onDone={() =>
                    changed("Employee department saved. Counts refreshed.")
                  }
                  onCancel={() => setMoving(null)}
                />
              )}
              <EmployeeDirectory
                kind="departments"
                id={id}
                disabled={locked}
                onMove={setMoving}
              />
            </>
          )}
          {tab === "hierarchy" && <DepartmentTree id={id} />}
        </>
      )}
    </>
  );
}
