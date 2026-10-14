"use client";

import { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import { getCriteria, getCriteriaFramework, saveCriterion, setCriterionStatus } from "@/services/framework-criteria.service";
import { saveFramework } from "@/services/performance-framework.service";
import type { CompetencyInput, Criterion, CriteriaKind, KpiInput } from "@/types/framework-criteria";
import { buttonClass, Field, inputClass, secondaryClass } from "@/components/organization/ui";
import CriteriaTable, { CriteriaScoringCards } from "./criteria-table";
import CriterionForm from "./criterion-form";
import CriteriaLoadState from "./criteria-load-state";

function CriteriaPanel({ frameworkId, kind, onKind, onReload, onLock }: {
  frameworkId: string; kind: CriteriaKind; onKind: (kind: CriteriaKind) => void; onReload: () => void; onLock: (locked: boolean) => void;
}) {
  const load = useCallback(async (signal: AbortSignal) => {
    const [framework, criteria] = await Promise.all([
      getCriteriaFramework(frameworkId, signal), getCriteria(frameworkId, kind, { search: "", status: "" }, signal),
    ]);
    return { framework, ...criteria };
  }, [frameworkId, kind]);
  const resource = useOrganizationResource(load);
  const [editor, setEditor] = useState<{ item: Criterion | null } | null>(null);
  const [pending, setPending] = useState<Criterion | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const data = resource.data;
  const locked = busy || Boolean(editor) || Boolean(pending);
  const readonly = data?.framework.status === "archived";
  const noun = kind === "competencies" ? "Competency" : "KPI";

  function failed(error: unknown) {
    setError(getApiErrorMessage(error));
    if (isAxiosError(error) && error.response?.status === 409) {
      setConflict(true); onLock(true);
    } else onLock(Boolean(editor) || Boolean(pending));
  }

  async function mutate(operation: () => Promise<void>) {
    if (busy || conflict) return;
    setBusy(true); onLock(true); setError("");
    try { await operation(); onReload(); }
    catch (error) { failed(error); }
    finally { setBusy(false); }
  }

  async function save(values: CompetencyInput | KpiInput) {
    setBusy(true); onLock(true); setError("");
    try {
      if ("category" in values) await saveCriterion(frameworkId, "competencies", values, editor?.item?._id);
      else await saveCriterion(frameworkId, "kpis", values, editor?.item?._id);
      onReload();
    } catch (error) { failed(error); throw error; }
    finally { setBusy(false); }
  }

  return <>
    <CriteriaLoadState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!resource.loading && !resource.error && data && <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{data.framework.name} <span className="ml-2 text-sm font-normal capitalize text-slate-500">{data.framework.status}</span></h2>
        <div className="flex gap-2">{data.framework.status !== "draft" && <button type="button" className={secondaryClass} disabled={locked || conflict} onClick={() => void mutate(async () => { await saveFramework({ status: "draft" }, frameworkId); })}>Move to draft</button>}{data.framework.status === "draft" && <button type="button" className={buttonClass} disabled={locked || conflict || !data.scoring.weightsValid} onClick={() => void mutate(async () => { await saveFramework({ status: "active" }, frameworkId); })}>Activate Framework</button>}<button type="button" className={secondaryClass} disabled={locked && !conflict} onClick={onReload}>Reload</button></div>
      </div>
      <CriteriaScoringCards scoring={data.scoring} />
      <p className="mb-5 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">{readonly ? "Archived frameworks are read-only. Move this framework to draft to edit its criteria." : data.framework.status === "active" ? "Changes to an active framework must keep active weights at 100%. Move to draft to rebalance multiple criteria, then activate again." : "Draft frameworks can have incomplete weights while you configure them. Activation requires active weights to total 100%."}</p>
      {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"><p>{error}</p>{conflict && <><p className="mt-2">Reload the latest framework before retrying. Reloading discards unsaved form changes.</p><button type="button" className={`${secondaryClass} mt-3`} onClick={onReload}>Reload latest framework</button></>}</div>}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label="Criterion type" className="flex gap-2">{(["competencies", "kpis"] as const).map((value) => <button key={value} type="button" aria-pressed={kind === value} disabled={locked || conflict} onClick={() => onKind(value)} className={kind === value ? buttonClass : secondaryClass}>{value === "competencies" ? "Competencies" : "KPIs"}</button>)}</div><button type="button" className={buttonClass} disabled={readonly || locked || conflict || data.items.length >= 100} onClick={() => { setEditor({ item: null }); onLock(true); setError(""); }}>+ Add {noun}</button></div>
      {data.items.length >= 100 && <p className="mb-4 text-sm text-slate-500">This framework has reached the 100-item limit for this criterion type, including inactive items.</p>}
      {editor && <CriterionForm kind={kind} item={editor.item} disabled={conflict || readonly} onSave={save} onCancel={() => { setEditor(null); onLock(conflict); }} />}
      {pending && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-semibold">Deactivate {pending.name}?</h3><p className="mt-2 text-sm text-slate-600">This item will be excluded from the active weight total. Its details will be preserved.</p><div className="mt-4 flex gap-3"><button type="button" className={buttonClass} disabled={busy || conflict} onClick={() => void mutate(() => setCriterionStatus(frameworkId, kind, pending._id, "inactive"))}>{busy ? "Saving..." : "Deactivate"}</button><button type="button" className={secondaryClass} disabled={busy} onClick={() => { setPending(null); onLock(conflict); }}>Cancel</button></div></div>}
      <fieldset disabled={locked || conflict} className="mb-5 grid gap-3 sm:grid-cols-2"><Field label={`Search ${kind === "competencies" ? "competencies" : "KPIs"}`}><input type="search" maxLength={200} className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or description" /></Field><Field label="Filter by status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></fieldset>
      <CriteriaTable kind={kind} items={data.items.filter((item) => (!status || item.status === status) && `${item.name}\n${item.description}`.toLowerCase().includes(search.trim().toLowerCase()))} filtered={Boolean(search.trim() || status)} disabled={readonly || locked || conflict} onEdit={(item) => { setEditor({ item }); onLock(true); setError(""); }} onDeactivate={(item) => { setPending(item); onLock(true); setError(""); }} />
    </>}
  </>;
}

export default function CriteriaWorkspace({ frameworkId, onLock }: { frameworkId: string; onLock: (locked: boolean) => void }) {
  const [kind, setKind] = useState<CriteriaKind>("competencies");
  const [version, setVersion] = useState(0);
  return <CriteriaPanel key={`${kind}:${version}`} frameworkId={frameworkId} kind={kind} onKind={setKind} onLock={onLock} onReload={() => { onLock(false); setVersion((version) => version + 1); }} />;
}
