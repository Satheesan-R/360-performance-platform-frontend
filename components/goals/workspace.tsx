"use client";

import { useEffect, useState } from "react";
import { keyResultProgress, objectiveProgress } from "@/lib/goals";
import { readGoalDrafts, writeGoalDrafts } from "@/services/goals-draft.service";
import type { Objective } from "@/types/goals";
import ObjectiveEditor, { newObjective } from "./objective-editor";

const control = "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200";
const badges = { draft: "bg-slate-100 text-slate-700", active: "bg-blue-50 text-blue-700", completed: "bg-emerald-50 text-emerald-700", archived: "bg-amber-50 text-amber-800" };
const scopes = { organization: "Organization", team: "Team", individual: "Individual" };

function Progress({ value, label }: { value: number; label: string }) {
  return <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${value}%` }} /></div>;
}

function displayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function GoalsWorkspace() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Objective | null>(null);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("");
  const [status, setStatus] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  function load() {
    try { setObjectives(readGoalDrafts()); setReady(true); setError(""); }
    catch { setError("Unable to read your browser drafts. Existing data has been preserved. Check browser storage access and try again."); }
  }
  useEffect(() => { Promise.resolve().then(load); }, []);

  function persist(next: Objective[], message: string): boolean {
    try {
      writeGoalDrafts(next);
      setObjectives(next);
      setNotice(message);
      setError("");
      return true;
    } catch {
      setError("Your changes could not be saved. Check available browser storage and try again. Your form is still open.");
      return false;
    }
  }
  function save(objective: Objective): boolean {
    const exists = objectives.some(item => item.id === objective.id);
    const next = exists ? objectives.map(item => item.id === objective.id ? objective : item) : [objective, ...objectives];
    if (!persist(next, "Objective saved in this browser.")) return false;
    setEditing(null);
    return true;
  }
  const filtered = objectives.filter(item => (!scope || item.scope === scope) && (!status || item.status === status)
    && `${item.title} ${item.description} ${item.owner} ${item.keyResults.map(result => result.title).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const active = objectives.filter(item => item.status === "active");
  const average = active.length ? Math.round(active.reduce((sum, item) => sum + objectiveProgress(item), 0) / active.length) : 0;

  return <main className="mx-auto max-w-7xl pb-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold text-blue-600">HR WORKSPACE</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Goals & OKRs</h1><p className="mt-2 text-slate-500">Set clear objectives and track the results that matter.</p></div>
      <button type="button" disabled={!ready || !!editing} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => { setEditing(newObjective()); setNotice(""); }}>Create objective</button>
    </div>
    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><strong>Browser draft workspace.</strong> Records are saved for your account in this browser only. They are not shared with employees or synced to the server. Review-cycle linking and employee assignment are pending integration.</div>
    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}{!ready && <button type="button" className="ml-3 underline" onClick={load}>Try again</button>}</div>}
    <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>
    {editing ? <ObjectiveEditor key={editing.id} initial={editing} onSave={save} onCancel={() => { setEditing(null); setError(""); }} /> : <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Total objectives", objectives.length], ["Active objectives", active.length], ["Completed objectives", objectives.filter(item => item.status === "completed").length], ["Active progress", `${average}%`]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{ready ? value : "—"}</p></div>)}
      </div>
      <section aria-label="Objective filters" className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="min-w-48 flex-1 text-sm font-medium text-slate-700">Search objectives<input type="search" className={`${control} mt-2 block w-full`} placeholder="Search titles, owners or key results" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label className="text-sm font-medium text-slate-700">Scope<select className={`${control} mt-2 block w-full`} value={scope} onChange={event => setScope(event.target.value)}><option value="">All scopes</option>{Object.entries(scopes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Status<select className={`${control} mt-2 block w-full`} value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{Object.keys(badges).map(key => <option key={key} value={key}>{key[0].toUpperCase() + key.slice(1)}</option>)}</select></label>
        {(search || scope || status) && <button type="button" className="py-2.5 text-sm font-semibold text-blue-700" onClick={() => { setSearch(""); setScope(""); setStatus(""); }}>Clear filters</button>}
      </section>
      {!ready ? <p className="py-12 text-center text-slate-500">{error ? "Drafts are unavailable." : "Loading your drafts…"}</p> : !filtered.length ? <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><h2 className="text-lg font-semibold">{objectives.length ? "No matching objectives" : "Start with a clear outcome"}</h2><p className="mx-auto mt-2 max-w-lg text-slate-500">{objectives.length ? "Adjust your search or filters to find an objective." : "Create your first objective and add measurable key results to track progress over your chosen review period."}</p>{!objectives.length && <button type="button" className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white" onClick={() => setEditing(newObjective())}>Create first objective</button>}</section> : <section aria-label="Objectives" className="mt-6 space-y-4">
        <p className="text-sm text-slate-500">Showing {filtered.length} of {objectives.length} objectives</p>
        {filtered.map(objective => {
          const progress = objectiveProgress(objective);
          return <article key={objective.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-slate-500">{scopes[objective.scope]}</span><span className={`rounded-full px-3 py-1 font-medium capitalize ${badges[objective.status]}`}>{objective.status}</span></div><h2 className="mt-3 break-words text-xl font-semibold">{objective.title}</h2><p className="mt-2 break-words text-sm text-slate-500">Owner: {objective.owner} · {displayDate(objective.startDate)} – {displayDate(objective.endDate)}</p></div><button type="button" aria-label={`Edit ${objective.title} and update progress`} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50" onClick={() => { setEditing(objective); setNotice(""); setDeleting(null); }}>Edit / update progress</button></div>
            {objective.description && <p className="mt-4 whitespace-pre-wrap break-words text-slate-600">{objective.description}</p>}
            <div className="mt-5"><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-600">Overall progress</span><span className="font-bold text-blue-700">{progress}%</span></div><Progress value={progress} label={`${objective.title} progress`} /></div>
            <details className="mt-5 border-t border-slate-100 pt-4"><summary className="cursor-pointer text-sm font-semibold text-slate-700">{objective.keyResults.length} key {objective.keyResults.length === 1 ? "result" : "results"}</summary><ul className="mt-4 space-y-4">{objective.keyResults.map(result => <li key={result.id} className="rounded-xl bg-slate-50 p-4"><p className="break-words font-medium text-slate-800">{result.title}</p><div className="mb-3 mt-2 flex flex-wrap justify-between gap-2 text-sm text-slate-500"><span>Baseline {result.baseline} · Current {result.current} · Target {result.target} {result.unit}</span><span className="font-semibold text-blue-700">{keyResultProgress(result)}%</span></div><Progress value={keyResultProgress(result)} label={`${result.title} progress`} /></li>)}</ul></details>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">{deleting === objective.id ? <><p className="text-sm text-slate-700">Delete this objective and its key results?</p><button type="button" className="text-sm font-semibold text-red-700" onClick={() => { if (persist(objectives.filter(item => item.id !== objective.id), "Objective deleted from this browser.")) setDeleting(null); }}>Delete objective</button><button type="button" className="text-sm font-semibold text-slate-600" onClick={() => setDeleting(null)}>Keep objective</button></> : <button type="button" aria-label={`Delete ${objective.title}`} className="text-sm text-slate-500 hover:text-red-700" onClick={() => setDeleting(objective.id)}>Delete browser draft</button>}</div>
          </article>;
        })}
      </section>}
    </>}
  </main>;
}
