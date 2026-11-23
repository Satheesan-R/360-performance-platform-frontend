"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { correctionFields, validateCorrection, type CorrectionField, type ProfileCorrection } from "@/lib/profile-details";
import type { SelfProfile } from "@/lib/personal-settings";
import { getProfileCorrections, reviewProfileCorrection, submitProfileCorrection } from "@/services/profile-details.service";
import { Field, inputClass, secondaryClass } from "./settings-ui";

export default function ProfileCorrections({ profile, timezone, onDirty, onBusy, onUpdated }: {
  profile: SelfProfile; timezone: string; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void; onUpdated: () => void;
}) {
  const [field, setField] = useState<CorrectionField>("jobTitle"); const [proposedValue, setProposedValue] = useState(""); const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<ProfileCorrection[]>([]); const [queue, setQueue] = useState<ProfileCorrection[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true); const [reload, setReload] = useState(0); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [errors, setErrors] = useState<Record<string, string>>({});
  const canRequest = Boolean(profile.capabilities?.corrections); const canReview = Boolean(profile.capabilities?.correctionReview);
  useEffect(() => { onDirty(Boolean(proposedValue || reason || Object.values(notes).some(Boolean))); }, [proposedValue, reason, notes, onDirty]);
  useEffect(() => {
    if (!canRequest && !canReview) return;
    const controller = new AbortController();
    Promise.all([canRequest ? getProfileCorrections(profile.id, false, controller.signal) : Promise.resolve([]), canReview ? getProfileCorrections(profile.id, true, controller.signal) : Promise.resolve([])])
      .then(([own, pending]) => { if (!controller.signal.aborted) { setRequests(own); setQueue(pending); setError(""); } })
      .catch((reason) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [profile.id, canRequest, canReview, reload]);
  function refresh() { setLoading(true); setReload((value) => value + 1); }
  function activity(value: boolean) { setBusy(value); onBusy(value); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const validation = validateCorrection({ field, proposedValue, reason });
    if (proposedValue.trim() === (profile.employee?.[field] ?? "")) validation.proposedValue = "Enter a value different from the current record.";
    setErrors(validation);
    if (Object.keys(validation).length) { document.getElementById(`correction-${Object.keys(validation)[0]}`)?.focus(); return; }
    activity(true);
    try { await submitProfileCorrection({ field, proposedValue, reason }, profile.id); setProposedValue(""); setReason(""); setMessage("Correction request submitted to HR. Your official details stay unchanged until approval."); refresh(); }
    catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { activity(false); }
  }
  async function review(id: string, decision: "approved" | "rejected") {
    if (decision === "rejected" && !notes[id]?.trim()) { setError("Add a review note explaining why this request is rejected."); document.getElementById(`review-note-${id}`)?.focus(); return; }
    activity(true); setError(""); setMessage("");
    try { await reviewProfileCorrection(id, decision, notes[id] ?? "", profile.id); setNotes((previous) => { const next = { ...previous }; delete next[id]; return next; }); setMessage(decision === "approved" ? "Correction approved and the official employment record updated." : "Correction rejected. The employee can see your review note."); refresh(); onUpdated(); }
    catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { activity(false); }
  }
  function card(request: ProfileCorrection, reviewable: boolean) {
    return <li key={request.id} className="space-y-3 rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{request.requesterName ? `${request.requesterName} · ` : ""}{correctionFields.find(({ key }) => key === request.field)?.label ?? request.field}</p><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${request.status === "approved" ? "bg-emerald-50 text-emerald-700" : request.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{request.status}</span></div><dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Current when requested</dt><dd className="break-words text-slate-700">{request.currentValue || "Not provided"}</dd></div><div><dt className="text-slate-500">Requested correction</dt><dd className="break-words text-slate-700">{request.proposedValue}</dd></div></dl><p className="whitespace-pre-wrap break-words text-sm text-slate-600">{request.reason}</p><p className="text-xs text-slate-500">Submitted {new Date(request.createdAt).toLocaleString("en", { timeZone: timezone })}</p>{request.reviewNote && <p className="break-words text-sm text-slate-600">HR note: {request.reviewNote}</p>}{request.reviewedAt && <p className="text-xs text-slate-500">Reviewed {new Date(request.reviewedAt).toLocaleString("en", { timeZone: timezone })}</p>}{reviewable && <fieldset disabled={busy} className="space-y-3"><Field id={`review-note-${request.id}`} label="Review note" hint="Required when rejecting a request."><textarea id={`review-note-${request.id}`} className={inputClass} rows={2} maxLength={500} value={notes[request.id] ?? ""} onChange={(event) => setNotes({ ...notes, [request.id]: event.target.value })} /></Field><div className="flex flex-wrap justify-end gap-3"><button type="button" className={secondaryClass} onClick={() => void review(request.id, "rejected")}>Reject</button><button type="button" className={secondaryClass} onClick={() => void review(request.id, "approved")}>Approve and update record</button></div></fieldset>}</li>;
  }
  return <section className="space-y-5 rounded-2xl border border-slate-200 p-4 sm:p-5"><div><h3 className="text-base font-semibold text-slate-900">Request a correction</h3><p className="mt-1 text-sm leading-6 text-slate-500">Ask HR to correct your job title, department or reporting manager. Approval updates the official record; rejected requests keep their review note.</p></div>
    {canRequest ? <form noValidate onSubmit={submit}><fieldset disabled={busy || loading} className="space-y-4"><Field id="correction-field" label="Employment field" error={errors.field}><select id="correction-field" className={inputClass} value={field} onChange={(event) => { setField(event.target.value as CorrectionField); setErrors({}); }}>{correctionFields.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}</select></Field><p className="text-sm text-slate-500">Current value: {profile.employee?.[field] || "Not provided"}</p><Field id="correction-proposedValue" label="Correct value" error={errors.proposedValue} hint={field === "department" ? "Use the exact name of an existing active department." : field === "reportingManager" ? "Use the manager's employee number to identify them unambiguously." : undefined}><input id="correction-proposedValue" className={inputClass} maxLength={120} value={proposedValue} aria-invalid={Boolean(errors.proposedValue)} aria-describedby={errors.proposedValue ? "correction-proposedValue-error" : undefined} onChange={(event) => { setProposedValue(event.target.value); setErrors({}); }} /></Field><Field id="correction-reason" label="Reason for correction" error={errors.reason}><textarea id="correction-reason" className={inputClass} rows={3} maxLength={500} value={reason} aria-invalid={Boolean(errors.reason)} aria-describedby={errors.reason ? "correction-reason-error" : undefined} onChange={(event) => { setReason(event.target.value); setErrors({}); }} /></Field><div className="flex flex-wrap justify-end gap-3"><button type="button" className={secondaryClass} disabled={!proposedValue && !reason} onClick={() => { setProposedValue(""); setReason(""); setErrors({}); }}>Clear</button><button type="submit" className={secondaryClass}>{busy ? "Submitting…" : "Submit correction request"}</button></div></fieldset></form> : <p className="text-sm text-slate-500">Correction requests are unavailable for this account.</p>}
    {(canRequest || canReview) && <><div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-slate-800">Your correction requests</h4><button type="button" disabled={busy || loading} className={secondaryClass} onClick={refresh}>Refresh</button></div>{loading ? <p role="status" className="text-sm text-slate-500">Loading correction requests…</p> : requests.length ? <ul className="space-y-3">{requests.map((request) => card(request, false))}</ul> : <p className="text-sm text-slate-500">You have no correction requests.</p>}</>}
    {canReview && <div className="space-y-4 border-t border-slate-200 pt-5"><h4 className="text-base font-semibold text-slate-900">HR review queue</h4><p className="text-sm leading-6 text-slate-500">Review pending requests from other employees in this organization. You cannot approve your own request. Department and manager corrections must match existing organization records.</p>{queue.length ? <ul className="space-y-3">{queue.map((request) => card(request, true))}</ul> : !loading && <p className="text-sm text-slate-500">No pending requests to review.</p>}</div>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div aria-live="polite">{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}</div>
  </section>;
}
