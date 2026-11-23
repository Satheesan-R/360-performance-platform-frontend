"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { templateTargetRoleLabels } from "@/lib/review-template";
import { getEmployees } from "@/services/employee.service";
import { getActiveDepartments, type DepartmentOption } from "@/services/department.service";
import ReviewerAssignments from "./reviewer-assignments";
import CycleResults from "./cycle-results";
import { getReviewTemplate, getReviewTemplates } from "@/services/review-template.service";
import { getReviewCycle, getReviewCycles, publishReviewCycle, saveReviewCycle } from "@/services/review-cycle.service";
import type { CycleInput, CycleList, ReviewCycle } from "@/types/review-cycle";
import type { ReviewTemplate, TemplateListItem } from "@/types/review-template";
import type { Employee } from "@/types/employee";

const empty = (): CycleInput => ({ name: "", templateId: "", departmentIds: [], employeeIds: [], startDate: "", endDate: "", reviewerAssignments: [] });
const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2";
const button = "rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50";
const departmentId = (e: Employee) => typeof e.departmentId === "string" ? e.departmentId : e.departmentId?._id;

export default function ReviewCycles() {
  const [list, setList] = useState<CycleList | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templateResult, setTemplateResult] = useState<{ key: string; template?: ReviewTemplate; error?: string } | null>(null);
  const [roleRetry, setRoleRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [resultsId, setResultsId] = useState("");
  const [cycle, setCycle] = useState<ReviewCycle>();
  const [values, setValues] = useState<CycleInput>(empty);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const templateRequestKey = `${values.templateId}:${refresh}:${roleRetry}`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const data = await getReviewCycles(page, controller.signal);
        if (!controller.signal.aborted) setList(data);
      } catch (e) { if (!controller.signal.aborted) { setList(null); setError(getApiErrorMessage(e)); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [page, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOptions() {
      setReady(false);
      try {
        const token = getToken();
        if (!token) throw new Error("Please log in again.");
        const templatePromise = (async () => {
          const all: TemplateListItem[] = [];
          let next = 1;
          let pages = 1;
          do {
            const data = await getReviewTemplates({ search: "", status: "active", frameworkId: "", page: next }, controller.signal);
            all.push(...data.templates);
            pages = data.pagination.totalPages;
            next++;
          } while (next <= pages);
          return all.filter(t => t.approvalStatus === "approved" && t.targetRole && Object.hasOwn(templateTargetRoleLabels, t.targetRole));
        })();
        const [ts, ds, es] = await Promise.all([templatePromise, getActiveDepartments(token, controller.signal), getEmployees(token, controller.signal)]);
        if (!controller.signal.aborted) {
          setTemplates(ts); setDepartments(ds);
          setEmployees(es);
          setReady(true);
        }
      } catch (e) { if (!controller.signal.aborted) setError(getApiErrorMessage(e)); }
    }
    void loadOptions();
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!values.templateId || !editing) return;
    const controller = new AbortController();
    const id = values.templateId;
    getReviewTemplate(id, controller.signal).then(data => {
      if (!controller.signal.aborted) setTemplateResult({ key: templateRequestKey, template: data });
    }).catch(error => {
      if (!controller.signal.aborted) setTemplateResult({ key: templateRequestKey, error: getApiErrorMessage(error) });
    });
    return () => controller.abort();
  }, [values.templateId, editing, templateRequestKey]);

  async function open(id: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await getReviewCycle(id);
      setCycle(data);
      setValues({ name: data.name, templateId: data.templateId, departmentIds: data.departmentIds, employeeIds: data.employeeIds, startDate: data.startDate, endDate: data.endDate, reviewerAssignments: data.reviewerAssignments ?? [] });
      setConflict(false); setEditing(true);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  }

  const template = templates.find(t => t._id === values.templateId);
  const allowedDepartments = (template?.departmentIds ?? []).map(value => typeof value === "string" ? value : (value as { _id: string })._id);
  const effectiveDepartments = values.departmentIds.length ? values.departmentIds : allowedDepartments;
  const currentTemplateResult = templateResult?.key === templateRequestKey ? templateResult : null;
  const templateDetails = currentTemplateResult?.template;
  const roleError = currentTemplateResult?.error ?? "";
  const targetRole = templateDetails?.targetRole;
  const employmentTypes = templateDetails?.employmentTypeIds.length
    ? templateDetails.employmentTypeIds
    : (templateDetails?.frameworkSnapshot?.applicableEmploymentTypeIds ?? []).map(type => typeof type === "string" ? type : type._id);
  const jobRoles = (templateDetails?.frameworkSnapshot?.applicableJobRoles ?? []).map(title => title.trim().toLowerCase());
  const eligible = targetRole
    ? employees.filter(e => e.user?.role === targetRole && e.user.status === "active" &&
      (!effectiveDepartments.length || effectiveDepartments.includes(departmentId(e) ?? "")) &&
      (!employmentTypes.length || employmentTypes.includes((typeof e.employmentTypeId === "string" ? e.employmentTypeId : e.employmentTypeId?._id) ?? "")) &&
      (!jobRoles.length || jobRoles.includes(e.jobTitle?.trim().toLowerCase() ?? "")))
    : [];
  const candidates = eligible.filter(e => `${e.firstName} ${e.lastName} ${e.workEmail}`.toLowerCase().includes(search.toLowerCase()));
  const readOnly = !!cycle && cycle.status !== "draft";
  function toggle(key: "departmentIds" | "employeeIds", id: string) {
    setValues(v => ({ ...v, [key]: v[key].includes(id) ? v[key].filter(x => x !== id) : [...v[key], id],
      reviewerAssignments: key === "employeeIds" && v.employeeIds.includes(id)
        ? (v.reviewerAssignments ?? []).filter(assignment => assignment.employeeId !== id)
        : v.reviewerAssignments,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (!values.name.trim()) { setError("Enter a cycle name."); return; }
    if (new Date(values.endDate) <= new Date(values.startDate)) { setError("End date must be after start date."); return; }
    if (!values.employeeIds.length || values.employeeIds.length > 500 || values.departmentIds.length > 500) { setError("Select 1–500 participants and at most 500 departments."); return; }
    if (values.employeeIds.some(id => !eligible.some(employee => employee._id === id))) { setError("Select participants who match the approved template."); return; }
    setBusy(true);
    try {
      await saveReviewCycle({ ...values, name: values.name.trim() }, cycle);
      setEditing(false);
      if (!cycle) setPage(1);
      setMessage("Draft saved. Reviews have not started."); setRefresh(x => x + 1);
    } catch (e) {
      setError(getApiErrorMessage(e));
      if (axios.isAxiosError(e) && e.response?.status === 409) setConflict(true);
    } finally { setBusy(false); }
  }

  async function publish(saved: ReviewCycle) {
    if (busy || !window.confirm(`Publish “${saved.name}”? Assigned reviewers will be able to open their review forms.`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await publishReviewCycle(saved);
      setMessage("Cycle published. Assigned reviewers can now open their review forms.");
      setRefresh(value => value + 1);
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Review Cycles</h1><p className="mt-2 text-slate-500">Prepare draft reviews using an admin-approved template.</p></div>
      <button className={button} disabled={busy || editing || Boolean(resultsId) || !ready} onClick={() => { setCycle(undefined); setValues(empty()); setConflict(false); setError(""); setMessage(""); setSearch(""); setEditing(true); }}>Create draft</button>
      <button className={button} disabled={busy || editing || !ready} onClick={() => { setCycle(undefined); setValues(empty()); setConflict(false); setError(""); setMessage(""); setSearch(""); setEditing(true); }}>Create draft</button>
    </div>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error} <button className={button} disabled={busy} onClick={() => { setError(""); setRefresh(x => x + 1); }}>Retry loading</button></div>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    {resultsId ? <CycleResults key={resultsId} id={resultsId} onBack={() => setResultsId("")} /> : editing ? <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold">{cycle ? "Review cycle details" : "New draft cycle"}</h2>
      {readOnly && <p>This cycle is read-only because it is no longer a draft.</p>}
      {conflict && <p role="alert">The draft or template has changed. Reload before saving again. Reload discards your changes.</p>}
      <fieldset disabled={busy || conflict || readOnly || !ready} className="space-y-5 disabled:opacity-60">
        <label className="block">Cycle name<input required maxLength={200} className={field} value={values.name} onChange={e => setValues({ ...values, name: e.target.value })} /></label>
        <label className="block">Approved template<select required className={field} value={values.templateId} onChange={e => setValues({ ...values, templateId: e.target.value, departmentIds: [], employeeIds: [], reviewerAssignments: [] })}>
          <option value="">Select a template</option>
          {!template && values.templateId && <option value={values.templateId}>Previously selected template (unavailable)</option>}
          {templates.map(t => <option key={t._id} value={t._id}>{t.name}{t.targetRole ? ` · ${templateTargetRoleLabels[t.targetRole]}` : ""}</option>)}
        </select></label>
        {!templates.length && <p>No active, approved templates are available.</p>}
        <div className="grid gap-4 sm:grid-cols-2">{(["startDate", "endDate"] as const).map(key => <label key={key}>{key === "startDate" ? "Start date" : "End date"} (UTC)<input type="date" required className={field} value={values[key].slice(0, 10)} onChange={e => setValues({ ...values, [key]: e.target.value })} /></label>)}</div>
        <fieldset><legend className="font-semibold">Departments</legend><p className="text-sm text-slate-500">Leave empty to inherit template departments. Changing departments may require updating participants.</p>
          <div className="mt-2 max-h-48 overflow-y-auto">{departments.filter(d => !allowedDepartments.length || allowedDepartments.includes(d._id)).map(d => <label key={d._id} className="block py-1"><input type="checkbox" checked={values.departmentIds.includes(d._id)} onChange={() => toggle("departmentIds", d._id)} /> {d.name}</label>)}</div>
          {values.departmentIds.filter(id => !departments.some(d => d._id === id) || (allowedDepartments.length > 0 && !allowedDepartments.includes(id))).map(id => <label className="block" key={id}><input type="checkbox" checked onChange={() => toggle("departmentIds", id)} /> Unavailable department ({id}) - remove to update</label>)}
        </fieldset>
        <fieldset><legend className="font-semibold">Participants ({values.employeeIds.length}/500)</legend><p className="text-sm text-slate-500">{targetRole ? `Active ${templateTargetRoleLabels[targetRole]} accounts matching the template’s department, employment type, and job title.` : "Select an approved template to find eligible participants."}</p>
          <input aria-label="Search participants" placeholder="Search participants" className={`${field} my-2`} value={search} onChange={e => setSearch(e.target.value)} />
          <div className="max-h-64 overflow-y-auto">{candidates.map(e => <label key={e._id} className="block py-2"><input type="checkbox" checked={values.employeeIds.includes(e._id)} onChange={() => toggle("employeeIds", e._id)} /> {e.firstName} {e.lastName} <span className="text-sm text-slate-500">{e.workEmail}</span></label>)}{targetRole && !candidates.length && <p>No matching eligible participants.</p>}</div>
          {values.employeeIds.filter(id => !candidates.some(e => e._id === id)).map(id => <label className="block py-1" key={id}><input type="checkbox" checked onChange={() => toggle("employeeIds", id)} /> Selected participant outside this view: {employees.find(e => e._id === id)?.workEmail ?? id}</label>)}
        </fieldset>
        <ReviewerAssignments key={values.templateId} participantIds={values.employeeIds} employees={employees}
          roles={templateDetails?.frameworkSnapshot?.enabledReviewers ?? []}
          loading={!!values.templateId && !templateDetails && !roleError}
          error={roleError} onRetry={() => setRoleRetry(value => value + 1)}
          assignments={values.reviewerAssignments ?? []} onChange={reviewerAssignments => setValues(value => ({ ...value, reviewerAssignments }))} />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!template}>{busy ? "Saving..." : "Save draft"}</button>
      </fieldset>
      <div className="flex flex-wrap gap-3">{cycle && <button type="button" className={button} disabled={busy} onClick={() => { void open(cycle._id); setRefresh(x => x + 1); }}>Reload saved draft (discard changes)</button>}
        {!cycle && conflict && <button type="button" className={button} disabled={busy} onClick={() => { setConflict(false); setRefresh(x => x + 1); }}>Reload options</button>}
        <button type="button" className={button} disabled={busy} onClick={() => { setEditing(false); setError(""); setMessage(""); }}>Close editor (discard unsaved changes)</button>
      </div>
    </form> : <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 font-bold">Saved cycles</h2>
      {loading ? <p role="status">Loading cycles...</p> : list ? <>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Name</th><th>Status</th><th>Review period (UTC)</th><th>Participants</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{list.cycles.map(c => <tr key={c._id} className="border-t border-slate-100"><td className="p-3 font-medium">{c.name}</td><td className="capitalize">{c.status}</td><td>{c.startDate.slice(0, 10)} - {c.endDate.slice(0, 10)}</td><td>{c.employeeIds.length}</td><td>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} className={button} onClick={() => void open(c._id)}>Open</button>
              {c.status === "draft" && <button type="button" disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" onClick={() => void publish(c)}>Publish cycle</button>}
              {c.status === "published" && <button type="button" disabled={busy} className={button} onClick={() => { setError(""); setMessage(""); setResultsId(c._id); }}>View results</button>}
            </div>
          </td></tr>)}</tbody>
        </table></div>
        {!list.cycles.length && <p>No review cycles yet.</p>}
        <div className="mt-4 flex items-center gap-3"><button className={button} disabled={busy || page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} of {Math.max(1, list.pagination.totalPages)}</span><button className={button} disabled={busy || page >= list.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button></div>
      </> : <p>Cycles could not be loaded.</p>}
    </section>}
  </div>;
}

