"use client";

import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { validatePassword, type SelfProfile } from "@/lib/personal-settings";
import { changeSelfPassword } from "@/services/personal-settings.service";
import { Field, inputClass, secondaryClass } from "./settings-ui";

export default function PersonalSecurity({ profile, loading, onDirty, onBusy, onChanged }: { profile: SelfProfile | null; loading: boolean; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void; onChanged: () => void }) {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({}); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  function update(key: keyof typeof values, value: string) { const next = { ...values, [key]: value }; setValues(next); onDirty(Object.values(next).some(Boolean)); setErrors({}); setError(""); setMessage(""); }
  function clear() { setValues({ current: "", next: "", confirm: "" }); onDirty(false); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const validation = validatePassword(values.current, values.next, values.confirm); setErrors(validation);
    if (Object.keys(validation).length) { document.getElementById(`personal-password-${Object.keys(validation)[0]}`)?.focus(); return; }
    if (!profile?.capabilities?.passwordChange) { setError("Password changes are not supported for this account."); return; }
    setBusy(true); onBusy(true);
    try { await changeSelfPassword(values.current, values.next, profile.id); clear(); setMessage("Your password has been changed."); onChanged(); }
    catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setBusy(false); onBusy(false); }
  }
  if (loading) return <p role="status" className="text-sm text-slate-500">Loading account security…</p>;
  const managed = profile?.capabilities?.authMethod === "sso" || profile?.capabilities?.authMethod === "managed";
  return <div className="space-y-7">
    {managed ? <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900"><h3 className="font-semibold">Managed sign-in</h3><p className="mt-2">Your organization’s identity provider manages this account. Change your password through your organization’s identity-management process or contact IT. No separate password is created here.</p></div> : profile?.capabilities?.passwordChange ? <form noValidate onSubmit={submit} className="space-y-5">
      <h3 className="text-sm font-semibold text-slate-800">Change password</h3>
      {([{ key: "current", label: "Current password", autocomplete: "current-password" }, { key: "next", label: "New password", autocomplete: "new-password" }, { key: "confirm", label: "Confirm new password", autocomplete: "new-password" }] as const).map(({ key, label, autocomplete }) => <Field key={key} id={`personal-password-${key}`} label={label} error={errors[key]}><input id={`personal-password-${key}`} className={inputClass} type={show ? "text" : "password"} required autoComplete={autocomplete} disabled={busy} maxLength={128} value={values[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `personal-password-${key}-error` : key === "next" ? "personal-password-policy" : undefined} onChange={(event) => update(key, event.target.value)} /></Field>)}
      <p id="personal-password-policy" className="text-xs leading-5 text-slate-500">At least 8 characters, different from your current password, and at most 72 UTF-8 bytes. The server verifies your current password.</p>
      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={busy} aria-pressed={show} className="rounded text-sm font-semibold text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => setShow(!show)}>{show ? "Hide passwords" : "Show passwords"}</button><div className="flex flex-wrap gap-3"><button type="button" disabled={busy} className={secondaryClass} onClick={() => { clear(); setErrors({}); setError(""); setMessage(""); }}>Clear</button><button type="submit" disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Changing password…" : "Change password"}</button></div></div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    </form> : <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Password-change capability is unavailable. Load your account profile or contact IT before changing credentials.</p>}
    <div className="border-t border-slate-200 pt-5"><h3 className="text-sm font-semibold text-slate-800">Multi-factor authentication</h3><p className="mt-2 text-sm leading-6 text-slate-500">Status unavailable: the current authentication API does not expose MFA enrollment or setup. Contact IT or your identity provider for the applicable process.</p></div>
  </div>;
}
