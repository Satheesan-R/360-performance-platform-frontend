"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getOrganization, getOrganizationSummary, updateOrganization } from "@/services/organization.service";
import { getApiErrorMessage } from "@/lib/api";
import type { Organization } from "@/types/organization";
import { buttonClass, secondaryClass, inputClass, Field, Status, PageHeading, ResourceState } from "./ui";

export default function OrganizationOverview() {
  const details = useOrganizationResource(getOrganization);
  const summary = useOrganizationResource(getOrganizationSummary);
  const [draft, setDraft] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const { _id, ...values } = draft;
      void _id;
      await updateOrganization(values);
      setDraft(null); setSuccess("Organization details updated.");
      await details.reload();
    } catch (error) { setError(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  }
  const organization = details.data;
  return <>
    <PageHeading title="Organization Overview" description="Company details and your current organization structure.">
      <button type="button" className={buttonClass} disabled={!organization || details.loading || Boolean(draft)} onClick={() => { setDraft(organization); setError(""); setSuccess(""); }}>Edit Organization</button>
    </PageHeading>
    {success && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <ResourceState loading={details.loading} error={details.error} retry={details.reload} />
    {!details.loading && !details.error && organization && (draft ? <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-lg font-bold">Edit organization</h2>
      <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
        {([{ key: "name", label: "Organization name", required: true }, { key: "code", label: "Organization code", required: true }, { key: "industry", label: "Industry" }, { key: "contactEmail", label: "Contact email", type: "email", required: true }, { key: "country", label: "Country", required: true }, { key: "timezone", label: "Timezone (e.g. Asia/Colombo)", required: true }, { key: "logoUrl", label: "Logo URL", type: "url" }] as const).map((field) => <Field key={field.key} label={field.label}><input className={inputClass} type={"type" in field ? field.type : "text"} required={"required" in field && field.required} value={draft[field.key] ?? ""} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })} /></Field>)}
        <Field label="Status"><select className={inputClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Organization["status"] })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <div className="sm:col-span-2"><Field label="Description"><textarea className={inputClass} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field></div>
      </fieldset>
      <div className="mt-6 flex gap-3"><button type="submit" disabled={saving} className={buttonClass}>{saving ? "Saving..." : "Save changes"}</button><button type="button" disabled={saving} className={secondaryClass} onClick={() => { setDraft(null); setError(""); }}>Cancel</button></div>
    </form> : <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-4">{organization.logoUrl ? <Image unoptimized src={organization.logoUrl} alt={`${organization.name} logo`} width={64} height={64} className="h-16 w-16 rounded-xl object-contain" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-2xl font-bold text-blue-600">{organization.name.slice(0, 2).toUpperCase()}</div>}<div><h2 className="text-xl font-bold">{organization.name}</h2><p className="mt-1 text-sm text-slate-500">{organization.code}</p></div><div className="ml-auto"><Status value={organization.status} /></div></div>
      <dl className="grid gap-6 sm:grid-cols-2">{[["Industry", organization.industry], ["Contact email", organization.contactEmail], ["Country", organization.country], ["Timezone", organization.timezone], ["Description", organization.description]].map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{value || "—"}</dd></div>)}</dl>
    </section>)}
    <section aria-label="Organization summary" className="mt-6">
      <ResourceState loading={summary.loading} error={summary.error} retry={summary.reload} />
      {!summary.loading && !summary.error && summary.data && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Total employees", summary.data.totalEmployees], ["Departments", summary.data.departments], ["Teams", summary.data.teams], ["Active review frameworks", summary.data.activeReviewFrameworks]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p></div>)}</div>}
    </section>
  </>;
}
