"use client";

import { useMemo, useState, type FormEvent } from "react";
import zxcvbn from "zxcvbn";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import { validatePassword, type SelfProfile } from "@/lib/personal-settings";
import { changeSelfPassword } from "@/services/personal-settings.service";
import { Field, inputClass, secondaryClass } from "./settings-ui";

type Values = { current: string; next: string; confirm: string };
export default function PersonalSecurity({ profile, loading, onDirty, onBusy }: { profile: SelfProfile | null; loading: boolean; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const validation = validatePassword(values.current, values.next, values.confirm);
  const strength = useMemo(() => values.next ? zxcvbn(values.next, [profile?.email ?? "", profile?.employee?.firstName ?? "", profile?.employee?.lastName ?? ""]) : null, [values.next, profile]);
  const strengthLabels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const bytes = new TextEncoder().encode(values.next).length;
  function update(key: keyof Values, value: string) {
    const next = { ...values, [key]: value };
    setValues(next); onDirty(Object.values(next).some(Boolean)); setErrors({}); setError("");
  }
  function clear() {
    setValues({ current: "", next: "", confirm: "" });
    setVisible({ current: false, next: false, confirm: false });
    onDirty(false); setErrors({}); setError("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setErrors(validation);
    if (Object.keys(validation).length) {
      document.getElementById(`personal-password-${Object.keys(validation)[0]}`)?.focus(); return;
    }
    if (!profile?.capabilities?.passwordChange) { setError("Password changes are not supported for this account."); return; }
    setBusy(true); onBusy(true);
    try {
      const result = await changeSelfPassword(values.current, values.next, profile.id);
      clear();
      // The backend has revoked all sessions, including this browser's token.
      const notice = result.notification?.status === "accepted" ? "changed" : "changed-email-unavailable";
      try { sessionStorage.setItem("performance_password_change_notice", notice); } catch { /* The URL also carries the non-sensitive result. */ }
      clearSession();
      router.replace(`/login?security=${notice}`);
    } catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setBusy(false); onBusy(false); }
  }
  if (loading) return <p role="status" className="text-sm text-slate-500">Loading account security...</p>;
  const managed = profile?.capabilities?.authMethod === "sso" || profile?.capabilities?.authMethod === "managed";
  const lastChanged = profile?.passwordChangedAt ? new Date(profile.passwordChangedAt) : null;
  return <div className="space-y-7">
    {managed ? <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900"><h3 className="font-semibold">Managed sign-in</h3><p className="mt-2">Your organization manages your password. Use its identity provider or contact IT to change it.</p></div> : profile?.capabilities?.passwordChange ? <form noValidate onSubmit={submit} className="space-y-5">
      <div><h3 className="text-base font-semibold text-slate-900">Change password</h3><p className="mt-1 text-xs text-slate-500">{lastChanged && !Number.isNaN(lastChanged.getTime()) ? `Last changed: ${lastChanged.toLocaleString()}` : "No previous password change recorded."}</p></div>
      {([{ key: "current", label: "Current password", autocomplete: "current-password" }, { key: "next", label: "New password", autocomplete: "new-password" }, { key: "confirm", label: "Confirm new password", autocomplete: "new-password" }] as const).map(({ key, label, autocomplete }) => {
        const fieldError = errors[key] || (values[key] ? validation[key] : undefined);
        return <Field key={key} id={`personal-password-${key}`} label={label} error={fieldError}>
          <div className="relative"><input id={`personal-password-${key}`} className={`${inputClass} pr-20`} type={visible[key] ? "text" : "password"} required autoComplete={autocomplete} disabled={busy} maxLength={128} value={values[key]} aria-invalid={Boolean(fieldError)} aria-describedby={[fieldError ? `personal-password-${key}-error` : "", key === "next" ? "personal-password-policy personal-password-strength" : ""].filter(Boolean).join(" ") || undefined} onChange={(event) => update(key, event.target.value)} />
            <button type="button" disabled={busy} aria-label={`${visible[key] ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible[key]} aria-controls={`personal-password-${key}`} onClick={() => setVisible({ ...visible, [key]: !visible[key] })} className="absolute inset-y-0 right-3 rounded text-xs font-semibold text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600">{visible[key] ? "Hide" : "Show"}</button></div>
        </Field>;
      })}
      <div id="personal-password-policy" className="rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600"><p className="font-semibold text-slate-800">Password requirements</p><ul className="mt-1 space-y-1">
        <li>{values.next.length >= 8 ? "✓" : "○"} At least 8 characters</li>
        <li>{values.next && bytes <= 72 ? "✓" : "○"} At most 72 UTF-8 bytes ({bytes}/72)</li>
        <li>{values.next && values.current && values.next !== values.current ? "✓" : "○"} Different from your current password</li>
        <li>{values.confirm && values.next === values.confirm ? "✓" : "○"} New passwords match</li>
      </ul><p className="mt-2">Use a long, unique passphrase. Password managers and pasting are supported.</p></div>
      <div id="personal-password-strength" className="space-y-2" aria-live="polite">
        <div className="flex justify-between text-xs"><span className="font-semibold text-slate-700">Password strength</span><span>{strength ? strengthLabels[strength.score] : "Enter a new password"}</span></div>
        <meter min={0} max={4} value={strength?.score ?? 0} aria-label="Estimated password strength" className="h-2 w-full" />
        {strength && <p className="text-xs leading-5 text-slate-500">{[strength.feedback.warning, ...strength.feedback.suggestions].filter(Boolean).join(" ") || "Use this password only for this account."}</p>}
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><p className="font-semibold">All devices will be signed out</p><p>After changing your password, sign in again with your new password. We will attempt to email a security alert to your account address.</p></div>
      <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} className={secondaryClass} onClick={clear}>Clear</button><button type="submit" disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Changing password..." : "Change password"}</button></div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form> : <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Password changes are unavailable. Reload your profile or contact IT.</p>}
    <div className="border-t border-slate-200 pt-5"><h3 className="text-sm font-semibold text-slate-800">Two-step verification</h3><p className="mt-2 text-sm leading-6 text-slate-500">Authenticator setup is not available yet. Contact IT if your organization requires multi-factor authentication.</p></div>
  </div>;
}
