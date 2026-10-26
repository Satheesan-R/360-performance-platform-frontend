"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { roleNames, type SelfProfile } from "@/lib/personal-settings";
import { supportService, categoryLabels, queueLabels, supportTransitions, type SupportContext, type SupportTicket, type SupportResult, type TicketPage } from "@/services/account-support.service";
import { Field, Icon, inputClass, secondaryClass } from "./settings-ui";
import styles from "./personal-account.module.css";

const primary = "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const warning = "Never include passwords, OTP codes, recovery codes, or secret tokens in a support request.";
type Tab = "new" | "mine" | "queue" | "access";
function Status({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${value === "RESOLVED" || value === "CLOSED" ? "bg-emerald-50 text-emerald-800" : value === "ESCALATED" ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-blue-800"}`}>{value.replaceAll("_", " ")}</span>;
}
export default function AccountSupport({ profile, timezone, onClose }: { profile: SelfProfile; timezone: string; onClose: () => void }) {
  const [context, setContext] = useState<SupportContext | null>(null);
  const [contextError, setContextError] = useState(""); const [reload, setReload] = useState(0);
  const [tab, setTab] = useState<Tab>("new");
  const [category, setCategory] = useState("LOGIN_PASSWORD"); const [subject, setSubject] = useState(""); const [description, setDescription] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [page, setPage] = useState(1); const [queue, setQueue] = useState("");
  const [results, setResults] = useState<TicketPage | null>(null); const [listError, setListError] = useState("");
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [reply, setReply] = useState(""); const [note, setNote] = useState(""); const [status, setStatus] = useState("");
  const [officers, setOfficers] = useState<{ id: string; email: string }[]>([]); const [officerError, setOfficerError] = useState("");
  const [assignee, setAssignee] = useState(""); const [priority, setPriority] = useState("NORMAL");
  const [memberEmail, setMemberEmail] = useState(""); const [memberQueues, setMemberQueues] = useState<string[]>(["IT"]); const [memberActive, setMemberActive] = useState(true);

  useEffect(() => {
    const abort = new AbortController();
    supportService.context(abort.signal).then(value => { if (!abort.signal.aborted) { setContext(value); setContextError(""); } }).catch(reason => { if (!abort.signal.aborted) setContextError(getApiErrorMessage(reason)); });
    return () => abort.abort();
  }, [reload]);
  useEffect(() => {
    if (!context || !["mine", "queue"].includes(tab)) return;
    const abort = new AbortController();
    supportService.list(tab, page, tab === "queue" ? queue : "", abort.signal).then(value => { if (!abort.signal.aborted) { setResults(value); setListError(""); } }).catch(reason => { if (!abort.signal.aborted) setListError(getApiErrorMessage(reason)); });
    return () => abort.abort();
  }, [context, tab, page, queue, reload]);
  useEffect(() => {
    if (!ticket?.canManage) return;
    const abort = new AbortController();
    supportService.officers(ticket.queue, abort.signal).then(value => { if (!abort.signal.aborted) { setOfficers(value.officers); setOfficerError(""); } }).catch(reason => { if (!abort.signal.aborted) setOfficerError(getApiErrorMessage(reason)); });
    return () => abort.abort();
  }, [ticket?.id, ticket?.queue, ticket?.canManage]);

  function selectTab(next: Tab) { setTab(next); setTicket(null); setResults(null); setListError(""); setPage(1); setError(""); setNotice(""); }
  function editRequest(change: () => void) { change(); setRequestId(crypto.randomUUID()); setError(""); }
  function accept(result: SupportResult, message: string) {
    setTicket(result.ticket); setAssignee(result.ticket.assigneeId || ""); setPriority(result.ticket.priority); setStatus(""); setNote(""); setReply("");
    setNotice(`${message} ${result.notification?.message || "Check this page for updates."}`); setResults(null); setReload(value => value + 1);
  }
  async function create(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    if (subject.trim().length < 5 || description.trim().length < 20) { setError("Enter a subject of at least 5 characters and a description of at least 20 characters."); return; }
    setBusy(true);
    try {
      const result = await supportService.create({ category, subject, description, requestId });
      accept(result, result.replayed ? "Your existing request is shown below." : `Request ${result.ticket.number} created.`);
      setSubject(""); setDescription(""); setRequestId(crypto.randomUUID()); setTab("mine"); setPage(1);
    } catch (reason) { setError(getApiErrorMessage(reason)); } finally { setBusy(false); }
  }
  async function open(id: string) {
    setBusy(true); setError(""); setNotice("");
    try { const result = await supportService.read(id); setTicket(result.ticket); setAssignee(result.ticket.assigneeId || ""); setPriority(result.ticket.priority); setReply(""); setNote(""); setStatus(""); setOfficers([]); }
    catch (reason) { setError(getApiErrorMessage(reason)); } finally { setBusy(false); }
  }
  async function action(run: () => Promise<SupportResult>, message: string) {
    setBusy(true); setError(""); setNotice("");
    try { accept(await run(), message); } catch (reason) { setError(getApiErrorMessage(reason)); } finally { setBusy(false); }
  }
  async function grant(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { setNotice((await supportService.membership(memberEmail, memberQueues, memberActive)).message); setMemberEmail(""); setReload(value => value + 1); }
    catch (reason) { setError(getApiErrorMessage(reason)); } finally { setBusy(false); }
  }
  function close() { if ((subject || description || reply || note) && !window.confirm("Leave account support and discard unsent text?")) return; onClose(); }
  const date = (value: string) => new Date(value).toLocaleString("en", { timeZone: timezone });
  const name = [profile.employee?.firstName, profile.employee?.lastName].filter(Boolean).join(" ") || profile.email;

  return <section aria-labelledby="account-support-heading" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="account-support-heading" className="text-lg font-semibold text-slate-900">Account Support</h3><p className="mt-1 text-sm text-slate-500">Get help with your account and access.</p></div><button type="button" disabled={busy} className={secondaryClass} onClick={close}>Back to account</button></div>
    {contextError ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700"><p>Account support could not be loaded: {contextError}</p><button type="button" className={`${secondaryClass} mt-3`} onClick={() => setReload(value => value + 1)}>Try again</button></div> : !context ? <p role="status" className="text-sm text-slate-500">Loading account support...</p> : <>
      <div role="tablist" aria-label="Account support" className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">{([['new', 'New request'], ['mine', 'My requests'], ...(context.queues.length ? [['queue', 'Support queue']] : []), ...(context.canManageAccess ? [['access', 'Support access']] : [])] as [Tab, string][]).map(([id, label]) => <button key={id} id={`support-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls="support-panel" disabled={busy} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 ${tab === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => selectTab(id)}>{label}</button>)}</div>
      {notice && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</p>}
      <div id="support-panel" role="tabpanel" aria-labelledby={`support-tab-${tab}`}>
        {tab === "new" && <form onSubmit={create} className="space-y-5"><div className={`${styles.tintedCard} rounded-xl border p-4`}><p className="text-sm font-semibold text-slate-900">Requesting as {name}</p><p className="mt-1 break-all text-xs text-slate-500">{profile.email} · {roleNames[profile.role]}</p></div><fieldset disabled={busy} className="space-y-5">
          <Field id="support-category" label="What do you need help with? *"><select id="support-category" className={inputClass} value={category} onChange={event => editRequest(() => setCategory(event.target.value))}>{context.categories.map(item => <option key={item.id} value={item.id}>{categoryLabels[item.id]}</option>)}</select></Field>
          <Field id="support-subject" label="Subject *" hint={`${subject.length}/160 characters`}><input id="support-subject" className={inputClass} value={subject} required minLength={5} maxLength={160} placeholder="Briefly describe your issue" onChange={event => editRequest(() => setSubject(event.target.value))} /></Field>
          <Field id="support-description" label="Describe the issue *" hint="20–5,000 characters. Include the error message and what you were trying to do, without secret credentials."><textarea id="support-description" className={inputClass} rows={5} value={description} required minLength={20} maxLength={5000} onChange={event => editRequest(() => setDescription(event.target.value))} /></Field>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"><Icon name="support" className="h-5 w-5 shrink-0 text-blue-700" /><div><p className="text-sm font-semibold text-slate-800">{queueLabels[context.categories.find(item => item.id === category)?.queue || 'IT']}</p><p className="mt-1 text-xs text-slate-500">Assigned by the platform. Business role changes require HR authorization.</p></div></div>
          <p className="text-xs leading-6 text-slate-500">{warning}</p><div className="flex justify-end gap-3"><button type="button" className={secondaryClass} onClick={() => { setSubject(""); setDescription(""); setRequestId(crypto.randomUUID()); setError(""); }}>Clear</button><button className={primary} type="submit">{busy ? "Submitting..." : "Submit Request"}</button></div>
        </fieldset></form>}

        {(tab === "mine" || tab === "queue") && <div className="space-y-5">
          {ticket ? <div className="space-y-5"><button type="button" disabled={busy} className="text-sm font-semibold text-blue-700" onClick={() => { setTicket(null); setError(""); setNotice(""); }}>← Back to requests</button><div className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-blue-700">{ticket.number}</p><h4 className="mt-1 break-words font-semibold text-slate-900">{ticket.subject}</h4></div><Status value={ticket.status} /></div><p className="mt-3 text-xs leading-6 text-slate-500">{categoryLabels[ticket.category]} · {queueLabels[ticket.queue]} · {ticket.priority}<br />Created {date(ticket.createdAt)} · Updated {date(ticket.updatedAt)}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{ticket.description}</p><p className="mt-3 text-xs text-slate-500">Assignee: {ticket.assigneeId ? officers.find(item => item.id === ticket.assigneeId)?.email || ticket.assigneeId : "Unassigned"}</p></div>
            <section className="space-y-3"><h4 className="text-sm font-semibold text-slate-900">Conversation</h4>{!ticket.messages?.length && <p className="text-sm text-slate-500">No replies yet.</p>}{ticket.messages?.map(item => <div key={item.id} className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-semibold text-blue-700">{item.authorType === "support" ? "Support" : "Requester"} · {date(item.createdAt)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.text}</p></div>)}</section>
            {!['RESOLVED', 'CLOSED'].includes(ticket.status) && <form onSubmit={event => { event.preventDefault(); void action(() => supportService.message(ticket.id, reply), "Reply saved."); }} className="space-y-3"><Field id="support-reply" label="Add a reply"><textarea id="support-reply" className={inputClass} required minLength={2} maxLength={5000} rows={3} value={reply} disabled={busy} onChange={event => setReply(event.target.value)} /></Field><p className="text-xs leading-5 text-slate-500">{warning}</p><button type="submit" disabled={busy} className={primary}>{busy ? "Saving..." : "Send reply"}</button></form>}
            {ticket.canReopen && <form onSubmit={event => { event.preventDefault(); void action(() => supportService.reopen(ticket.id, note), "Request reopened."); }} className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-600">Still need help? Reopen within {context.reopenDays} days of resolution.</p><Field id="support-reopen-note" label="Why do you need to reopen this request?"><textarea id="support-reopen-note" className={inputClass} required minLength={5} maxLength={2000} value={note} disabled={busy} onChange={event => setNote(event.target.value)} /></Field><button type="submit" className={secondaryClass} disabled={busy}>Reopen request</button></form>}
            {ticket.canManage && <section className="space-y-4 rounded-xl border border-slate-200 p-4"><h4 className="text-sm font-semibold text-slate-900">Support actions</h4>{officerError && <p role="alert" className="text-sm text-red-700">Assignees could not be loaded: {officerError}</p>}<form className="space-y-3" onSubmit={event => { event.preventDefault(); void action(() => supportService.assign(ticket.id, assignee || null, priority), "Assignment updated."); }}><fieldset disabled={busy || ticket.status === 'CLOSED'} className="grid gap-3 sm:grid-cols-2"><Field id="support-assignee" label="Assigned officer"><select id="support-assignee" className={inputClass} value={assignee} onChange={event => setAssignee(event.target.value)}><option value="">Unassigned</option>{officers.filter(item => item.id !== ticket.requesterId).map(item => <option key={item.id} value={item.id}>{item.email}</option>)}</select></Field><Field id="support-priority" label="Priority"><select id="support-priority" className={inputClass} value={priority} onChange={event => setPriority(event.target.value)}>{['NORMAL','HIGH','URGENT'].map(item => <option key={item}>{item}</option>)}</select></Field><button type="submit" className={secondaryClass}>Save assignment</button></fieldset></form>
              {(supportTransitions[ticket.status]?.length || 0) > 0 && <form className="space-y-3 border-t border-slate-200 pt-4" onSubmit={event => { event.preventDefault(); void action(() => supportService.status(ticket.id, status, note), "Status updated."); }}><Field id="support-status" label="Update status"><select id="support-status" className={inputClass} required disabled={busy} value={status} onChange={event => setStatus(event.target.value)}><option value="">Choose a status</option>{supportTransitions[ticket.status].map(item => <option key={item} value={item}>{item.replaceAll('_',' ')}</option>)}</select></Field><Field id="support-action-note" label="Resolution or action note"><textarea id="support-action-note" className={inputClass} required={['RESOLVED','CLOSED','ESCALATED'].includes(status)} minLength={5} maxLength={2000} rows={3} disabled={busy} value={note} onChange={event => setNote(event.target.value)} /></Field><p className="text-xs text-slate-500">Resolving, closing, and escalating require a note. This does not change HR records or permissions.</p><button type="submit" className={primary} disabled={busy}>Update status</button></form>}
            </section>}
            <section><h4 className="text-sm font-semibold text-slate-900">Resolution and activity history</h4><ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">{ticket.history?.map((item,index) => <li key={index} className="text-xs leading-6 text-slate-500"><span className="font-semibold text-slate-700">{item.action.replaceAll('_',' ')}</span> · {date(item.createdAt)}{item.to && <p>{item.from ? `${item.from} → ` : ''}{item.to}</p>}{item.assigneeId && <p className="break-all">Assignee: {item.assigneeId}</p>}{item.note && <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{item.note}</p>}</li>)}</ol></section>
          </div> : <>
            <div className="flex flex-wrap items-center justify-between gap-3">{tab === 'queue' && <label className="text-sm text-slate-600">Queue<select className={`${inputClass} ml-2 w-auto`} value={queue} onChange={event => { setQueue(event.target.value); setPage(1); setResults(null); }}>{['', ...context.queues].map(item => <option key={item} value={item}>{queueLabels[item] || 'All permitted queues'}</option>)}</select></label>}<button type="button" className={secondaryClass} disabled={busy} onClick={() => { setResults(null); setListError(''); setReload(value => value + 1); }}>Refresh</button></div>
            {listError ? <p role="alert" className="text-sm text-red-700">{listError}</p> : !results ? <p role="status" className="text-sm text-slate-500">Loading requests...</p> : !results.tickets.length ? <p className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">{tab === 'mine' ? 'You have not submitted any requests yet.' : 'No requests in this queue.'}</p> : <ul className="space-y-3">{results.tickets.map(item => <li key={item.id}><button type="button" disabled={busy} onClick={() => void open(item.id)} className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 focus-visible:outline-2"><div className="flex flex-wrap justify-between gap-2"><span className="text-xs font-semibold text-blue-700">{item.number}</span><Status value={item.status} /></div><p className="mt-2 break-words text-sm font-semibold text-slate-900">{item.subject}</p><p className="mt-2 text-xs text-slate-500">{queueLabels[item.queue]} · {date(item.updatedAt)}</p></button></li>)}</ul>}
            {results && <div className="flex items-center justify-between gap-3"><button type="button" className={secondaryClass} disabled={page === 1 || busy} onClick={() => { setPage(value => value - 1); setResults(null); }}>Previous</button><span className="text-xs text-slate-500">Page {page}</span><button type="button" className={secondaryClass} disabled={!results.hasMore || busy} onClick={() => { setPage(value => value + 1); setResults(null); }}>Next</button></div>}
          </>}
        </div>}
        {tab === 'access' && context.canManageAccess && <form onSubmit={grant} className="space-y-4"><p className="text-sm leading-6 text-slate-500">Grant named active accounts access to support queues. This does not change their platform role. HR already has HR Support access; admins can access both queues.</p><Field id="support-member-email" label="Support officer's account email"><input id="support-member-email" className={inputClass} type="email" required maxLength={254} value={memberEmail} disabled={busy} onChange={event => setMemberEmail(event.target.value)} /></Field><fieldset disabled={busy}><legend className="text-sm font-semibold text-slate-700">Permitted queues</legend><div className="mt-2 flex gap-4">{['IT','HR'].map(item => <label key={item} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={memberQueues.includes(item)} onChange={event => setMemberQueues(previous => event.target.checked ? [...previous,item] : previous.filter(value => value !== item))} />{queueLabels[item]}</label>)}</div></fieldset><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={memberActive} disabled={busy} onChange={event => setMemberActive(event.target.checked)} />Support membership active</label><button type="submit" className={primary} disabled={busy}>Save support access</button></form>}
      </div>
    </>}
  </section>;
}
