"use client";

import { useCallback, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import { getFrameworks, getFrameworkSummary, getFrameworkEmploymentTypes, saveFramework } from "@/services/performance-framework.service";
import type { FrameworkInput, FrameworkStatus, PerformanceFramework } from "@/types/performance-framework";
import { buttonClass, secondaryClass, inputClass, Field, PageHeading } from "@/components/organization/ui";

const statuses: FrameworkStatus[] = ["draft", "active", "archived"];
const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function LoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p role="status" className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading performance frameworks...</p>;
  if (error) return <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700"><p>{error}</p><button className={`${secondaryClass} mt-3`} type="button" onClick={retry}>Try again</button></div>;
  return null;
}

function FrameworkTable({ search, status, page, onPage, onEdit, editing }: {
  search: string; status: string; page: number; onPage: (page: number) => void; onEdit: (framework: PerformanceFramework) => void; editing: boolean;
}) {
  const load = useCallback((signal: AbortSignal) => getFrameworks({ search, status, page }, signal), [search, status, page]);
  const resource = useOrganizationResource(load);
  const data = resource.data;
  return <>
    <LoadState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!resource.loading && !resource.error && data && <>
      {data.frameworks.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="font-semibold">No frameworks found</h2><p className="mt-2 text-sm text-slate-500">{search || status ? "Try another search or status filter." : "Create your first framework to define performance criteria for your organization."}</p></div> :
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>{["Framework", "Applicable groups / job roles", "Competencies", "KPIs", "Rating scale", "Status", "Actions"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-4 font-semibold">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{data.frameworks.map((framework) => <tr key={framework._id}>
              <td className="min-w-56 px-5 py-4"><p className="font-semibold">{framework.name}</p><p className="mt-1 max-w-sm whitespace-pre-wrap break-words text-xs text-slate-500">{framework.description || "No description"}</p></td>
              <td className="min-w-48 px-5 py-4"><div className="flex max-w-sm flex-wrap gap-1">{[...framework.applicableEmploymentTypeIds.map((type) => `${type.name}${type.isActive ? "" : " (inactive)"}`), ...framework.applicableJobRoles].map((name, index) => <span key={index} className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">{name}</span>)}</div>{!framework.applicableEmploymentTypeIds.length && !framework.applicableJobRoles.length && <span className="text-slate-500">Not configured</span>}</td>
              <td className="px-5 py-4">{framework.competencyCount}</td><td className="px-5 py-4">{framework.kpiCount}</td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-500">{framework.ratingScale?.name || "Not configured"}</td>
              <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${framework.status === "active" ? "bg-emerald-50 text-emerald-700" : framework.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{label(framework.status)}</span></td>
              <td className="px-5 py-4"><button type="button" disabled={editing} aria-label={`Edit ${framework.name}`} className="font-semibold text-blue-600 hover:underline disabled:opacity-50" onClick={() => onEdit(framework)}>Edit</button></td>
            </tr>)}</tbody>
          </table>
        </div>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><p>{data.pagination.total} frameworks · Page {page} of {Math.max(1, data.pagination.totalPages)}</p><div className="flex gap-2"><button type="button" className={secondaryClass} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><button type="button" className={secondaryClass} disabled={page >= data.pagination.totalPages} onClick={() => onPage(page + 1)}>Next</button></div></div>
    </>}
  </>;
}

function FrameworkForm({ framework, onCancel, onSaved }: { framework: PerformanceFramework | null; onCancel: () => void; onSaved: () => void }) {
  const types = useOrganizationResource(getFrameworkEmploymentTypes);
  const initialIds = framework?.applicableEmploymentTypeIds.map((type) => type._id) ?? [];
  const [draft, setDraft] = useState<FrameworkInput>({ name: framework?.name ?? "", description: framework?.description ?? "", status: framework?.status ?? "draft", applicableEmploymentTypeIds: initialIds, applicableJobRoles: framework?.applicableJobRoles ?? [] });
  const [rolesText, setRolesText] = useState(draft.applicableJobRoles.join("\n"));
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState("");
  const options = [...(types.data ?? []), ...(framework?.applicableEmploymentTypeIds.filter((type) => !types.data?.some((option) => option._id === type._id)) ?? [])];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || conflict) return;
    const roles = rolesText.split("\n").map((role) => role.trim()).filter(Boolean);
    if (!draft.name.trim()) { setError("Enter a framework name."); return; }
    if (roles.length > 100 || roles.some((role) => role.length > 200) || new Set(roles.map((role) => role.toLowerCase())).size !== roles.length) {
      setError("Enter up to 100 unique job titles, each no longer than 200 characters."); return;
    }
    if (draft.applicableEmploymentTypeIds.length > 100) { setError("Select no more than 100 employment types."); return; }
    setSaving(true); setError("");
    try {
      const values: Partial<FrameworkInput> = { ...draft, name: draft.name.trim(), description: draft.description.trim(), applicableJobRoles: roles };
      // Preserve previously assigned inactive types during edits unless the selection changes.
      if (framework && initialIds.length === draft.applicableEmploymentTypeIds.length && initialIds.every((id) => draft.applicableEmploymentTypeIds.includes(id))) delete values.applicableEmploymentTypeIds;
      await saveFramework(values, framework?._id);
      onSaved();
    } catch (error) { setError(getApiErrorMessage(error)); setSaving(false); if (isAxiosError(error) && error.response?.status === 409) setConflict(true); }
  }

  return <form onSubmit={submit} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-5 text-lg font-bold">{framework ? "Edit framework" : "Create framework"}</h2>
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {conflict && <div role="alert" className="mb-5 text-sm text-red-700"><p>Reload the latest framework before retrying. Reloading discards unsaved changes.</p><button type="button" className={`${secondaryClass} mt-3`} onClick={() => window.location.reload()}>Reload latest framework</button></div>}
    <fieldset disabled={saving || conflict} className="grid gap-5 sm:grid-cols-2">
      <Field label="Framework name *"><input autoFocus required maxLength={200} className={inputClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Engineering Framework" /></Field>
      <Field label="Status"><select className={inputClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as FrameworkStatus })}>{statuses.map((status) => <option key={status} value={status} disabled={status === "active" && !framework?.weightsValid}>{label(status)}</option>)}</select></Field>
      <div className="sm:col-span-2"><Field label="Description"><textarea rows={3} maxLength={2000} className={inputClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field></div>
      <div><p className="mb-2 text-sm font-medium text-slate-700">Applicable employment types</p>
        <LoadState loading={types.loading} error={types.error} retry={types.reload} />
        {!types.loading && !types.error && <fieldset className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-4"><legend className="sr-only">Applicable employment types</legend>{options.map((type) => <label key={type._id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.applicableEmploymentTypeIds.includes(type._id)} disabled={!type.isActive && !draft.applicableEmploymentTypeIds.includes(type._id)} onChange={(event) => setDraft({ ...draft, applicableEmploymentTypeIds: event.target.checked ? [...draft.applicableEmploymentTypeIds, type._id] : draft.applicableEmploymentTypeIds.filter((id) => id !== type._id) })} />{type.name}{!type.isActive && " (inactive, existing assignment)"}</label>)}{!options.length && <p className="text-sm text-slate-500">No active employment types. Add them under Organization.</p>}</fieldset>}
      </div>
      <Field label="Applicable job titles (one per line)"><textarea rows={5} className={inputClass} value={rolesText} onChange={(event) => setRolesText(event.target.value)} placeholder={"Software Engineer\nSenior Software Engineer"} /></Field>
    </fieldset>
    <p className="mt-5 text-xs leading-5 text-slate-500">Groups and job titles describe the intended audience; they do not assign employees to reviews. New frameworks start as draft or archived. Configure active criteria weights totaling 100% under Competencies &amp; KPIs before activation. Rating scales and templates are configured separately.</p>
    <div className="mt-6 flex gap-3"><button className={buttonClass} type="submit" disabled={saving || conflict}>{saving ? "Saving..." : framework ? "Save changes" : "Create Framework"}</button><button className={secondaryClass} type="button" disabled={saving} onClick={onCancel}>Cancel</button></div>
  </form>;
}

export default function FrameworkOverview() {
  const summary = useOrganizationResource(getFrameworkSummary);
  const [editor, setEditor] = useState<{ framework: PerformanceFramework | null } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [success, setSuccess] = useState("");

  function saved() {
    setSuccess(editor?.framework ? "Framework updated." : "Framework created.");
    setEditor(null); setPage(1); setVersion((value) => value + 1);
    void summary.reload();
  }

  return <>
    <PageHeading title="Framework Overview" description="Create and manage performance frameworks for your organization's employee groups and job roles."><button type="button" className={buttonClass} disabled={Boolean(editor)} onClick={() => { setEditor({ framework: null }); setSuccess(""); }}>+ Create Framework</button></PageHeading>
    {success && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}
    <section aria-label="Framework summary" className="mb-6">
      <LoadState loading={summary.loading} error={summary.error} retry={summary.reload} />
      {!summary.loading && !summary.error && summary.data && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{(["total", ...statuses] as const).map((key) => <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{key === "total" ? "Total frameworks" : label(key)}</p><p className="mt-3 text-3xl font-bold">{summary.data![key]}</p></div>)}</div>}
    </section>
    {editor && <FrameworkForm key={editor.framework?._id ?? "new"} framework={editor.framework} onCancel={() => setEditor(null)} onSaved={saved} />}
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
      <form className="flex flex-1 items-end gap-2" onSubmit={(event) => { event.preventDefault(); setSearch(searchText.trim()); setPage(1); }}><div className="flex-1"><Field label="Search frameworks"><input type="search" className={inputClass} maxLength={200} value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Name, description, or job title" /></Field></div><button className={secondaryClass} type="submit">Search</button></form>
      <div className="sm:w-48"><Field label="Filter by status"><select className={inputClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field></div>
    </div>
    <FrameworkTable key={`${search}:${status}:${page}:${version}`} editing={Boolean(editor)} search={search} status={status} page={page} onPage={setPage} onEdit={(framework) => { setEditor({ framework }); setSuccess(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
  </>;
}
