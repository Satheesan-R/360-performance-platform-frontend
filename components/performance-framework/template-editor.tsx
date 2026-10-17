"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import { templateDraft, templatePatch, type TemplateDraft } from "@/lib/review-template";
import { getCriteriaFrameworks } from "@/services/framework-criteria.service";
import { getFrameworkEmploymentTypes } from "@/services/performance-framework.service";
import { getReviewTemplate, previewTemplateChanges, saveReviewTemplate } from "@/services/review-template.service";
import type { FrameworkEmploymentType, PerformanceFramework } from "@/types/performance-framework";
import type { ReviewTemplate, TemplatePreview } from "@/types/review-template";
import { buttonClass, Field, inputClass, secondaryClass } from "@/components/organization/ui";
import TemplateSectionsEditor from "./template-sections-editor";

function Editor({ template, frameworks, types, onSaved, onCancel, onReload }: { template?: ReviewTemplate; frameworks: PerformanceFramework[]; types: FrameworkEmploymentType[]; onSaved: () => void; onCancel: () => void; onReload: () => void }) {
  const [draft, setDraft] = useState(() => templateDraft(template));
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const frozen = template?.frameworkSnapshot && draft.status !== "draft" && draft.frameworkId === template.frameworkId;
  const framework = frozen ? template!.frameworkSnapshot! : frameworks.find((item) => item._id === draft.frameworkId);
  const readOnly = draft.status === "archived";
  const restrictions = framework?.applicableEmploymentTypeIds.map((item) => typeof item === "string" ? item : item._id) ?? [];
  const options = types.filter((item) => !restrictions.length || restrictions.includes(item._id));
  const disabled = busy || conflict || readOnly;
  function change(draft: TemplateDraft) { setDraft(draft); setDirty(true); setPreview(null); setError(""); }
  async function submit(previewOnly: boolean) {
    if (disabled) return;
    setError(""); setPreview(null);
    try {
      const values = templatePatch(draft, template);
      setBusy(true);
      if (previewOnly && template) setPreview(await previewTemplateChanges(template._id, values));
      else { await saveReviewTemplate(values, template?._id); onSaved(); }
    } catch (error) { setError(getApiErrorMessage(error)); if (isAxiosError(error) && error.response?.status === 409) setConflict(true); }
    finally { setBusy(false); }
  }
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">{template ? "Edit review template" : "Create review template"}</h2><p className="mt-1 text-sm text-slate-500">{template ? `${template.status} · Version ${template.__v ?? 0}` : "New templates start as draft"}{dirty ? " · Unsaved changes" : ""}</p></div><button type="button" className={secondaryClass} disabled={busy} onClick={onCancel}>{dirty ? "Discard & back" : "Back to templates"}</button></div>
    {frozen && <p className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">Using pinned framework version {template?.frameworkVersion}: {framework?.name}. Move the template to draft from the list before changing its framework or adopting newer criteria.</p>}
    {readOnly && <p className="mb-5 text-sm text-slate-600">Archived templates are read-only here. Move the template to draft from the list to edit its sections.</p>}
    {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"><p>{error}</p>{conflict && <><p className="mt-2">Reload before retrying. Reloading discards unsaved changes.</p><button type="button" className={`${secondaryClass} mt-3`} onClick={onReload}>Reload latest template</button></>}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><fieldset disabled={disabled} className="grid gap-5 sm:grid-cols-2">
      <Field label="Template name *"><input autoFocus maxLength={200} className={inputClass} value={draft.name} onChange={(event) => change({ ...draft, name: event.target.value })} /></Field>
      <Field label="Performance framework *"><select className={inputClass} disabled={draft.status !== "draft"} value={draft.frameworkId} onChange={(event) => change({ ...draft, frameworkId: event.target.value, employmentTypeIds: [], sections: draft.sections.map((section) => ({ ...section, competencyIds: [], kpiIds: [] })) })}><option value="">Choose a framework</option>{frameworks.filter((item) => item.status !== "archived" || item._id === draft.frameworkId).map((item) => <option key={item._id} value={item._id}>{item.name} · {item._id.slice(-6)}</option>)}{draft.frameworkId && !frameworks.some((item) => item._id === draft.frameworkId) && <option value={draft.frameworkId}>{framework?.name || "Previously selected framework"}</option>}</select></Field>
      <div className="sm:col-span-2"><Field label="Description"><textarea rows={3} maxLength={2000} className={inputClass} value={draft.description} onChange={(event) => change({ ...draft, description: event.target.value })} /></Field></div>
      <fieldset className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold">Employment types</legend>{options.map((item) => <label key={item._id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.employmentTypeIds.includes(item._id)} onChange={(event) => change({ ...draft, employmentTypeIds: event.target.checked ? [...draft.employmentTypeIds, item._id] : draft.employmentTypeIds.filter((id) => id !== item._id) })} />{item.name}</label>)}{draft.employmentTypeIds.filter((id) => !options.some((item) => item._id === id)).map((id) => <label key={id} className="flex gap-3 text-sm text-amber-700"><input type="checkbox" checked onChange={() => change({ ...draft, employmentTypeIds: draft.employmentTypeIds.filter((value) => value !== id) })} />Previously selected type ({id.slice(-6)}) — unavailable for new selections</label>)}{!options.length && <p className="text-sm text-slate-500">No active employment types available for this framework.</p>}</fieldset>
      <div className="space-y-4 text-sm text-slate-600"><p>Leave types unselected to inherit framework targeting. This does not assign employees to reviews.</p><label className="flex items-center gap-3 font-medium text-slate-700"><input type="checkbox" checked={draft.evidenceRequired} onChange={(event) => change({ ...draft, evidenceRequired: event.target.checked })} />Require evidence in every section</label><p>Evidence rules configure future responses; files are not uploaded here.</p></div>
    </fieldset><p className="mt-4 text-xs text-slate-500">Changing the framework clears selected criteria and employment types; section titles and questions remain.</p></section>
    {!frameworks.some((item) => item.status !== "archived") && !template && <p className="mt-4 text-sm text-slate-600">Create a draft or active framework in <Link className="text-blue-600 underline" href="/hr/performance-framework">Framework Overview</Link> first.</p>}
    <TemplateSectionsEditor sections={draft.sections} competencies={framework?.competencies ?? []} kpis={framework?.kpis ?? []} disabled={disabled} onChange={(sections) => change({ ...draft, sections })} />
    <div className="mt-6 flex flex-wrap gap-3"><button type="button" className={buttonClass} disabled={disabled || !draft.frameworkId} onClick={() => void submit(false)}>{busy ? "Working..." : template ? "Save template" : "Create Draft"}</button>{template && <button type="button" className={secondaryClass} disabled={disabled} onClick={() => void submit(true)}>Preview changes</button>}</div>
    {!template && <p className="mt-3 text-xs text-slate-500">Save the draft first to preview and activate it.</p>}
    {preview && <div className="mt-6 rounded-xl bg-blue-50 p-5 text-sm"><h3 className="font-semibold">Unsaved template preview</h3><p className="mt-2">{preview.validation.ready ? "Ready for activation" : preview.validation.message}</p><p className="mt-2">{preview.sections.length} sections · {preview.frameworkName} · Framework version {preview.frameworkVersion}</p></div>}
  </>;
}

export default function TemplateEditor({ id, onSaved, onCancel }: { id?: string; onSaved: () => void; onCancel: () => void }) {
  const [revision, setRevision] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => {
    const [template, frameworks, types] = await Promise.all([id ? getReviewTemplate(id, signal) : Promise.resolve(undefined), getCriteriaFrameworks(signal), getFrameworkEmploymentTypes(signal)]);
    return { template, frameworks, types };
  }, [id]);
  return <EditorLoader key={revision} load={load} onSaved={onSaved} onCancel={onCancel} onReload={() => setRevision((value) => value + 1)} />;
}
function EditorLoader({ load, ...actions }: { load: (signal: AbortSignal) => Promise<{ template: ReviewTemplate | undefined; frameworks: PerformanceFramework[]; types: FrameworkEmploymentType[] }>; onSaved: () => void; onCancel: () => void; onReload: () => void }) {
  const resource = useOrganizationResource(load);
  if (resource.loading) return <p role="status" className="p-6 text-sm text-slate-500">Loading template editor...</p>;
  if (resource.error) return <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700"><p>{resource.error}</p><div className="mt-3 flex gap-3"><button type="button" className={secondaryClass} onClick={resource.reload}>Try again</button><button type="button" className={secondaryClass} onClick={actions.onCancel}>Back to templates</button></div></div>;
  return resource.data ? <Editor {...resource.data} {...actions} /> : null;
}
