"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { personLabel } from "@/lib/organization-views";
import { getDepartment } from "@/services/organization-views.service";
import { PageHeading, ResourceState, secondaryClass, Status } from "./ui";
import EmployeeDirectory from "./employee-directory";
import StructureDirectory, {
  DeactivateDepartment,
} from "./structure-directory";
import StructureEditor from "./structure-editor";
import DepartmentTree from "./department-tree";
import EmployeeDepartment from "./employee-department";
import type { DirectoryPerson } from "@/types/organization-views";

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
            description={`${department.code} · ${personLabel(department.headEmployeeId)}`}
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
          {tab === "overview" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Department overview</h2>
                <Status value={department.status} />
              </div>
              <dl className="grid gap-6 sm:grid-cols-2">
                {[
                  ["Department head", personLabel(department.headEmployeeId)],
                  ["Teams", department.teamCount],
                  ["Employees", department.employeeCount],
                  ["Description", department.description || "No description"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="mt-2 whitespace-pre-wrap text-sm font-semibold">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-xs text-slate-500">
                Heads, team leads, and reporting managers are separate
                relationships. Counts include pending onboarding and disabled
                accounts.
              </p>
            </section>
          )}
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
