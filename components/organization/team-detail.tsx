"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { personLabel, referenceId, referenceLabel } from "@/lib/organization-views";
import { getTeam } from "@/services/organization-views.service";
import type { DirectoryPerson } from "@/types/organization-views";
import { buttonClass, PageHeading, ResourceState, secondaryClass, Status } from "./ui";
import EmployeeDirectory from "./employee-directory";
import StructureEditor from "./structure-editor";
import { AssignTeamMember, RemoveTeamMember } from "./team-membership";

export default function TeamDetail({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => getTeam(id, signal), [id]);
  const details = useOrganizationResource(load);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<DirectoryPerson | null>(null);
  const [message, setMessage] = useState("");
  const team = details.data;
  const departmentId = referenceId(team?.departmentId);
  const parentActive = team?.departmentId && typeof team.departmentId !== "string" && team.departmentId.status === "active";
  const canAssign = team?.status === "active" && parentActive;
  const locked = editing || assigning || Boolean(removing);
  function changed(message: string) {
    setEditing(false); setAssigning(false); setRemoving(null); setMessage(message);
    void details.reload();
  }
  return <>
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-sm text-slate-500"><Link href="/hr/organization/departments" className="hover:text-blue-700">Departments</Link><span>/</span>{departmentId ? <Link href={`/hr/organization/departments/${departmentId}`} className="hover:text-blue-700">{referenceLabel(team?.departmentId)}</Link> : <Link href="/hr/organization/teams">Teams</Link>}<span>/</span><span>{team?.name || "Team"}</span></nav>
    <ResourceState loading={details.loading} error={details.error} retry={details.reload} />
    {!details.loading && !details.error && team && <>
      <PageHeading title={team.name} description={`${team.code} · ${referenceLabel(team.departmentId)}`}><button type="button" className={secondaryClass} disabled={locked} onClick={() => setEditing(true)}>Edit Team</button></PageHeading>
      {message && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      {editing && <StructureEditor kind="teams" record={team} onSaved={() => changed("Team saved.")} onCancel={() => setEditing(false)} />}
      <div className="mb-6 flex gap-2" role="group" aria-label="Team views">{["overview", "employees"].map((value) => <button key={value} type="button" className={`${secondaryClass} ${tab === value ? "border-blue-600 bg-blue-50 text-blue-700" : ""}`} aria-pressed={tab === value} disabled={locked} onClick={() => setTab(value)}>{value === "overview" ? "Team details" : "Employees"}</button>)}</div>
      {tab === "overview" && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-bold">Team details</h2><Status value={team.status} /></div><dl className="grid gap-6 sm:grid-cols-2">{[["Department", referenceLabel(team.departmentId)], ["Team lead", personLabel(team.teamLeadEmployeeId)], ["Employees", team.employeeCount], ["Description", team.description || "No description"]].map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-2 whitespace-pre-wrap text-sm font-semibold">{value}</dd></div>)}</dl></section>}
      {tab === "employees" && <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Team employees</h2><button type="button" className={buttonClass} disabled={locked || !canAssign} onClick={() => setAssigning(true)}>Assign Employee</button></div>
        {!canAssign && <p className="mb-5 text-sm text-amber-700">New assignments require an active team and an active parent department.</p>}
        {assigning && <AssignTeamMember departmentId={departmentId} teamId={id} onDone={() => changed("Employee assigned. Team counts refreshed.")} onCancel={() => setAssigning(false)} />}
        {removing && <RemoveTeamMember employee={removing} onDone={() => changed("Employee removed from team. Department retained.")} onCancel={() => setRemoving(null)} />}
        <EmployeeDirectory kind="teams" id={id} disabled={locked} onRemove={setRemoving} />
      </>}
    </>}
  </>;
}
