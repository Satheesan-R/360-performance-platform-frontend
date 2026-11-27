"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import * as api from "@/services/goals.service";
import type { Goal, GoalCheckIn, GoalFilters, GoalKeyResult, GoalList, GoalPlan, PlanStatus } from "@/types/goals-api";
import type { DirectoryPerson, Pagination, TeamRecord } from "@/types/organization-views";
import { ActionForm, button, CheckInForm, control, Field, GoalForm, KeyResultForm, personName, PlanForm } from "./api-forms";

type Editor = { kind: "plan" } | { kind: "goal"; goal?: Goal } | { kind: "key"; goalId: string; result?: GoalKeyResult } | { kind: "check-in"; result: GoalKeyResult } | { kind: "goal-status"; goal: Goal; status: Goal["status"] } | { kind: "plan-status"; plan: GoalPlan; status: PlanStatus };
const date = (value: string) => value.slice(0, 10);

function Progress({ value, label }: { value: number; label: string }) {
  return <div className="mt-2"><div className="mb-1 flex justify-between text-sm text-slate-600"><span>{label}</span><span>{value}%</span></div><div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{ width: `${value}%` }} /></div></div>;
}

function History({ result, close }: { result: GoalKeyResult; close: () => void }) {
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<{ checkIns: GoalCheckIn[]; pagination: Pagination } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    api.getGoalCheckIns(result._id, page, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); }).catch(cause => { if (!controller.signal.aborted) setError(getApiErrorMessage(cause)); });
    return () => controller.abort();
  }, [result._id, page, retry]);
  return <section aria-label="Check-in history" className="mt-4 rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><h4 className="font-semibold">Check-in history: {result.title}</h4><button className={button} onClick={close}>Close</button></div>
    {error ? <p role="alert" className="mt-3 text-red-700">{error} <button className={button} onClick={() => { setError(""); setRetry(value => value + 1); }}>Retry</button></p> : !data ? <p role="status">Loading history…</p> : <>
      {!data.checkIns.length && <p className="mt-3 text-sm text-slate-500">No check-ins yet.</p>}
      <ul className="mt-3 space-y-3">{data.checkIns.map(item => <li key={item._id} className="rounded-lg bg-slate-50 p-3 text-sm"><p>#{item.sequence}: {item.previousValue} → {item.value} {result.unit}</p><p className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>{item.note && <p className="mt-1 whitespace-pre-wrap break-words">{item.note}</p>}</li>)}</ul>
      <div className="mt-3 flex items-center gap-3"><button className={button} disabled={page <= 1} onClick={() => { setData(null); setPage(page - 1); }}>Previous</button><span className="text-sm">Page {page} of {Math.max(1, data.pagination.totalPages)}</span><button className={button} disabled={page >= data.pagination.totalPages} onClick={() => { setData(null); setPage(page + 1); }}>Next</button></div>
    </>}
  </section>;
}

export default function GoalsWorkspace() {
  const [plans, setPlans] = useState<GoalPlan[]>([]);
  const [owners, setOwners] = useState<DirectoryPerson[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [optionsReady, setOptionsReady] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [data, setData] = useState<GoalList | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [filters, setFilters] = useState<GoalFilters>({ page: 1 });
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [history, setHistory] = useState<GoalKeyResult | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api.getGoalPlans(controller.signal), api.getGoalOwners(controller.signal), api.getGoalTeams(controller.signal)])
      .then(([nextPlans, nextOwners, nextTeams]) => { if (!controller.signal.aborted) { setPlans(nextPlans); setOwners(nextOwners); setTeams(nextTeams); setOptionsReady(true); setOptionsError(""); } })
      .catch(cause => { if (!controller.signal.aborted) setOptionsError(getApiErrorMessage(cause)); });
    return () => controller.abort();
  }, [revision, optionsRetry]);
  useEffect(() => {
    const controller = new AbortController();
    api.getGoals(filters, controller.signal).then(value => {
      if (controller.signal.aborted) return;
      if (filters.page > 1 && !value.goals.length) { setFilters(previous => ({ ...previous, page: previous.page - 1 })); return; }
      setData(value); setError("");
    }).catch(cause => { if (!controller.signal.aborted) setError(getApiErrorMessage(cause)); });
    return () => controller.abort();
  }, [filters, revision]);
  function refresh() { setEditor(null); setHistory(null); setData(null); setError(""); setNotice("Changes saved to the server."); setRevision(value => value + 1); }
  function open(value: Editor) { setEditor(value); setNotice(""); }
  function filter(values: Partial<GoalFilters>) { setData(null); setError(""); setFilters(previous => ({ ...previous, ...values, page: 1 })); }
  const visible = data?.goals.filter(goal => {
    const owner = owners.find(person => person._id === goal.ownerEmployeeId);
    return `${goal.title} ${goal.description} ${owner ? personName(owner) : goal.ownerEmployeeId} ${goal.keyResults.map(result => result.title).join(" ")}`.toLowerCase().includes(search.toLowerCase());
  }) ?? [];
  const editablePlans = plans.filter(plan => ["draft", "active"].includes(plan.status));
  const editorProps = { done: refresh, cancel: () => setEditor(null) };

  return <main className="mx-auto max-w-7xl space-y-6 pb-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">HR WORKSPACE</p><h1 className="mt-1 text-3xl font-bold">Goals & OKRs</h1><p className="mt-2 text-slate-500">Set objectives, define key results and record progress.</p></div><div className="flex gap-3"><button className={button} disabled={!!editor} onClick={() => open({ kind: "plan" })}>Create plan</button><button className={button} disabled={!!editor || !optionsReady || !editablePlans.length || !owners.length} onClick={() => open({ kind: "goal" })}>Create objective</button></div></div>
    <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Objectives and check-ins are saved to the server. Any drafts from the previous browser workspace remain in this browser and have not been uploaded. Goal plans define the dates for their objectives.</p>
    {optionsError && <p role="alert" className="text-sm text-red-700">Unable to refresh plans or employee/team options: {optionsError} <button className={button} onClick={() => setOptionsRetry(value => value + 1)}>Retry options</button></p>}
    {optionsReady && !owners.length && <p className="text-sm text-amber-800">Activate an employee account before assigning an objective owner.</p>}
    <p role="status" className="text-sm text-emerald-700">{notice}</p>
    {editor?.kind === "plan" && <PlanForm {...editorProps} />}
    {editor?.kind === "goal" && <GoalForm key={editor.goal?._id ?? "new"} initial={editor.goal} plans={plans} owners={owners} teams={teams} {...editorProps} />}
    {editor?.kind === "key" && <KeyResultForm key={editor.result?._id ?? editor.goalId} goalId={editor.goalId} initial={editor.result} {...editorProps} />}
    {editor?.kind === "check-in" && <CheckInForm key={editor.result._id} result={editor.result} {...editorProps} />}
    {editor?.kind === "goal-status" && <ActionForm title={`Set “${editor.goal.title}” to ${editor.status}`} {...editorProps} submit={() => api.updateGoal(editor.goal._id, { status: editor.status })}><p className="text-sm text-slate-600">{editor.status === "cancelled" ? "This preserves the objective and its history. HR can reopen it while its plan is active." : "Activation needs an active plan. Completion requires every key result to reach its target."}</p></ActionForm>}
    {editor?.kind === "plan-status" && <ActionForm title={`Set “${editor.plan.name}” to ${editor.status}`} {...editorProps} submit={() => api.updateGoalPlan(editor.plan._id, { status: editor.status })}><p className="text-sm text-slate-600">{editor.status === "closed" ? "Closing freezes all objectives and check-ins in this plan. A closed plan cannot be reopened." : editor.status === "archived" ? "Archiving preserves history and permanently locks the plan." : "Activating allows objectives in this plan to become active and receive check-ins."}</p></ActionForm>}
    <section aria-label="Goal plans" className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold">Goal plans</h2>{!optionsReady ? <p className="mt-3 text-sm text-slate-500">{optionsError ? "Plans unavailable." : "Loading plans…"}</p> : !plans.length ? <p className="mt-3 text-sm text-slate-500">Create a dated plan first, then add objectives and key results.</p> : <ul className="mt-4 space-y-3">{plans.map(plan => <li key={plan._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{plan.name} <span className="text-sm font-normal capitalize text-slate-500">({plan.status})</span></p><p className="text-sm text-slate-500">{date(plan.startDate)} – {date(plan.endDate)}</p></div>{plan.status !== "archived" && <button className={button} disabled={!!editor} onClick={() => open({ kind: "plan-status", plan, status: plan.status === "draft" ? "active" : plan.status === "active" ? "closed" : "archived" })}>{plan.status === "draft" ? "Activate plan" : plan.status === "active" ? "Close plan" : "Archive plan"}</button>}</li>)}</ul>}</section>
    <section aria-label="Objective filters" className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4">
      <Field label="Search this page"><input type="search" value={search} onChange={event => setSearch(event.target.value)} className={control} placeholder="Title, owner or key result" /></Field>
      <Field label="Goal plan"><select className={control} value={filters.planId ?? ""} onChange={event => filter({ planId: event.target.value || undefined })}><option value="">All plans</option>{plans.map(plan => <option key={plan._id} value={plan._id}>{plan.name}</option>)}</select></Field>
      <Field label="Scope"><select className={control} value={filters.level ?? ""} onChange={event => filter({ level: (event.target.value || undefined) as GoalFilters["level"] })}><option value="">All scopes</option>{["organization", "team", "individual"].map(value => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Status"><select className={control} value={filters.status ?? ""} onChange={event => filter({ status: (event.target.value || undefined) as GoalFilters["status"] })}><option value="">All statuses</option>{["draft", "active", "completed", "cancelled"].map(value => <option key={value}>{value}</option>)}</select></Field>
    </section>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error} <button className={button} onClick={() => { setError(""); setRevision(value => value + 1); }}>Retry objectives</button></p> : !data ? <p role="status" className="py-10 text-center text-slate-500">Loading objectives…</p> : <>
      <p className="text-sm text-slate-500">{data.pagination.total} objectives match the plan, scope and status filters. Showing {visible.length} on this page.</p>
      {!visible.length && <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">{search ? "No matching objectives on this page. Try another page or change the search." : "No objectives yet for these filters."}</p>}
      {visible.map(goal => {
        const plan = plans.find(item => item._id === goal.planId);
        const mutable = !!plan && ["draft", "active"].includes(plan.status);
        const editable = mutable && ["draft", "active"].includes(goal.status);
        const owner = owners.find(item => item._id === goal.ownerEmployeeId);
        return <article key={goal._id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm capitalize text-slate-500">{goal.level} · {goal.status}{goal.isOverdue ? " · Overdue" : ""}</p><h2 className="mt-2 break-words text-xl font-semibold">{goal.title}</h2><p className="mt-1 text-sm text-slate-500">Owner: {owner ? personName(owner) : goal.ownerEmployeeId} · {plan?.name ?? "Plan unavailable"}{plan ? ` · ${date(plan.startDate)} – ${date(plan.endDate)}` : ""}</p></div>{editable && <button className={button} disabled={!!editor} onClick={() => open({ kind: "goal", goal })}>Edit objective</button>}</div>
          {goal.description && <p className="whitespace-pre-wrap break-words text-slate-600">{goal.description}</p>}
          <Progress label="Overall progress" value={goal.progress} />
          <div className="space-y-3"><h3 className="font-semibold">Key results</h3>{!goal.keyResults.length && <p className="text-sm text-slate-500">Add measurable results before tracking progress.</p>}{goal.keyResults.map(result => <div key={result._id} className="rounded-xl bg-slate-50 p-4"><p className="break-words font-medium">{result.title}</p><p className="mt-1 text-sm text-slate-500">Baseline {result.startValue} · Current {result.currentValue} · Target {result.targetValue} {result.unit}</p><Progress label="Key result progress" value={result.progress} /><div className="mt-3 flex flex-wrap gap-3">{editable && <button className={button} disabled={!!editor} onClick={() => open({ kind: "key", goalId: goal._id, result })}>Edit key result</button>}{goal.status === "active" && plan?.status === "active" && <button className={button} disabled={!!editor} onClick={() => open({ kind: "check-in", result })}>Record check-in</button>}<button className={button} onClick={() => setHistory(result)}>View history</button></div>{history?._id === result._id && <History key={result._id} result={result} close={() => setHistory(null)} />}</div>)}</div>
          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">{editable && <button className={button} disabled={!!editor} onClick={() => open({ kind: "key", goalId: goal._id })}>Add key result</button>}{goal.status === "draft" && plan?.status === "active" && <button className={button} disabled={!!editor} onClick={() => open({ kind: "goal-status", goal, status: "active" })}>Activate objective</button>}{goal.status === "active" && plan?.status === "active" && <button className={button} disabled={!!editor} onClick={() => open({ kind: "goal-status", goal, status: "completed" })}>Complete objective</button>}{editable && <button className={button} disabled={!!editor} onClick={() => open({ kind: "goal-status", goal, status: "cancelled" })}>Cancel objective</button>}{["completed", "cancelled"].includes(goal.status) && plan?.status === "active" && <button className={button} disabled={!!editor} onClick={() => open({ kind: "goal-status", goal, status: "active" })}>Reopen objective</button>}</div>
        </article>;
      })}
      <nav aria-label="Objective pages" className="flex items-center gap-3"><button className={button} disabled={filters.page <= 1 || !!editor} onClick={() => { setData(null); setFilters(previous => ({ ...previous, page: previous.page - 1 })); }}>Previous</button><span className="text-sm">Page {filters.page} of {Math.max(1, data.pagination.totalPages)}</span><button className={button} disabled={filters.page >= data.pagination.totalPages || !!editor} onClick={() => { setData(null); setFilters(previous => ({ ...previous, page: previous.page + 1 })); }}>Next</button></nav>
    </>}
  </main>;
}
