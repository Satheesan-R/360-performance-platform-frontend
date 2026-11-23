"use client";

import { useState, type ReactNode } from "react";
import AccountSupport from "./account-support";
import styles from "./personal-account.module.css";
import { roleNames, type SelfProfile } from "@/lib/personal-settings";
import { ProfileAvatar } from "./profile-photo-editor";
import { Icon, secondaryClass } from "./settings-ui";

interface Props {
  profile: SelfProfile | null;
  loading: boolean;
  error: string;
  timezone: string;
  onRetry: () => void;
  onSecurity: () => void;
}

function Status({ value }: { value?: string }) {
  const label = value === "active" ? "Active" : value === "disabled" ? "Disabled" : value === "invited" ? "Invited" : value === "otp_verified" ? "Activation pending" : value ? value.replaceAll("_", " ") : "Unavailable";
  const color = value === "active" ? "bg-emerald-50 text-emerald-800" : value === "disabled" ? "bg-red-50 text-red-800" : value === "invited" || value === "otp_verified" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${color}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

function Detail({ label, icon, children, full = false }: { label: string; icon: string; children: ReactNode; full?: boolean }) {
  return <div className={`min-w-0 rounded-xl border border-slate-200 bg-white p-4 ${full ? "sm:col-span-2" : ""}`}>
    <dt className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon name={icon} className="h-4 w-4 shrink-0" />{label}</dt>
    <dd className="mt-3 text-sm text-slate-900">{children}</dd>
  </div>;
}

export default function PersonalAccount({ profile, loading, error, timezone, onRetry, onSecurity }: Props) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "failed">("idle");

  async function copyAccountId() {
    if (!profile?.id) return;
    setCopyState("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(profile.id);
      setCopyState("copied");
    } catch { setCopyState("failed"); }
  }

  if (loading) return <div aria-busy="true" className="space-y-4">
    <p role="status" className="text-sm text-slate-500">Loading your account...</p>
    <div aria-hidden="true" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" /><div className="min-w-0 flex-1 space-y-2"><div className="h-3 w-full max-w-36 rounded bg-slate-200" /><div className="h-3 w-full max-w-48 rounded bg-slate-200" /></div></div>
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2">{[0, 1].map(key => <div key={key} className="h-24 rounded-xl border border-slate-200 bg-slate-50" />)}</div>
  </div>;
  if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-5"><h3 className="text-sm font-semibold text-slate-900">Account information could not be loaded</h3><p role="alert" className="mt-2 break-words text-sm leading-6 text-red-700">{error}</p><button type="button" onClick={onRetry} className={`${secondaryClass} mt-4`}>Try again</button></div>;
  if (!profile?.id) return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h3 className="text-sm font-semibold text-slate-900">Account information is unavailable</h3><p className="mt-2 text-sm leading-6 text-slate-500">We could not find your account details. Try reloading them or contact your HR or IT team through your usual channel.</p><button type="button" onClick={onRetry} className={`${secondaryClass} mt-4`}>Reload account</button></div>;

  if (supportOpen) return <AccountSupport profile={profile} timezone={timezone} onClose={() => setSupportOpen(false)} />;

  const name = [profile.employee?.firstName, profile.employee?.lastName].filter(Boolean).join(" ").trim();
  const email = profile.employee?.workEmail || profile.email;
  const displayName = name || email || "Your account";
  const initials = name ? [profile.employee?.firstName?.[0], profile.employee?.lastName?.[0]].filter(Boolean).join("").toUpperCase() : email?.slice(0, 2).toUpperCase() || "?";
  const role = roleNames[profile.role] || "Unavailable";
  const created = profile.createdAt ? new Date(profile.createdAt) : null;
  const validCreated = created && !Number.isNaN(created.getTime()) ? created : null;

  return <div className="space-y-5">
    <p className="text-sm leading-6 text-slate-500">Your account details and support options, in one place.</p>

    <div className={`${styles.tintedCard} flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5`}>
      <ProfileAvatar photo={profile.details?.photo} name={displayName} initials={initials} />
      <div className="min-w-0 flex-1 basis-40"><h3 className="break-words text-base font-semibold text-slate-900">{displayName}</h3>{email && email !== displayName && <p className="mt-1 break-all text-sm text-slate-500">{email}</p>}<p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600"><Icon name="shield" className="h-3.5 w-3.5 text-teal-700" />{role}</p></div>
      <Status value={profile.status} />
    </div>

    <div>
      <h3 className="text-sm font-semibold text-slate-800">Account information</h3>
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Detail label="Account ID" icon="key" full>
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="min-w-0 select-all break-all font-mono text-xs font-medium sm:text-sm">{profile.id}</span><button type="button" onClick={() => void copyAccountId()} disabled={copyState === "copying"} aria-label="Copy account ID" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"><Icon name={copyState === "copied" ? "check" : "copy"} className="h-3.5 w-3.5" />{copyState === "copying" ? "Copying..." : copyState === "copied" ? "Copied" : "Copy ID"}</button></div>
          <p role="status" className={`mt-2 text-xs leading-5 ${copyState === "failed" ? "text-amber-800" : "text-slate-500"}`}>{copyState === "failed" ? "Could not access your clipboard. Select the account ID above and copy it manually." : copyState === "copied" ? "Account ID copied to clipboard." : "Use this ID when contacting your support team."}</p>
        </Detail>
        <Detail label="Assigned role" icon="account"><span className="font-semibold">{role}</span><p className="mt-2 text-xs leading-5 text-slate-500">Assigned by your organization.</p></Detail>
        <Detail label="Account status" icon="shield"><Status value={profile.status} /><p className="mt-2 text-xs leading-5 text-slate-500">{profile.status === "active" ? "Your account is enabled." : "Managed by authorized staff."}</p></Detail>
        {profile.organization?.name && <Detail label="Organization" icon="building"><span className="break-words font-semibold">{profile.organization.name}</span></Detail>}
        {validCreated && <Detail label="Account created" icon="account"><time dateTime={validCreated.toISOString()} className="font-semibold">{validCreated.toLocaleDateString("en", { timeZone: timezone, year: "numeric", month: "short", day: "numeric" })}</time></Detail>}
      </dl>
    </div>

    <section aria-labelledby="account-assistance-heading" className={`${styles.tintedCard} rounded-2xl border p-4 sm:p-5`}>
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700"><Icon name="support" className="h-4 w-4" /></span><div className="min-w-0"><h3 id="account-assistance-heading" className="text-sm font-semibold text-slate-900">Need account assistance?</h3><p className="mt-1.5 text-sm leading-6 text-slate-500">For access issues, role changes, or account updates, contact your organization’s HR or IT team through your usual support channel.</p></div></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><p className="max-w-sm text-xs leading-5 text-slate-500">Create a request and track replies from your support team.</p><button type="button" onClick={() => setSupportOpen(true)} className={secondaryClass}>Get Account Support</button></div>
    </section>

    <button type="button" onClick={onSecurity} className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"><span className="flex items-center gap-3"><Icon name="key" className="h-4 w-4 shrink-0 text-teal-700" /><span><span className="block text-sm font-semibold text-slate-800">Security and Login</span><span className="mt-0.5 block text-xs text-slate-500">Manage your password and sign-in security.</span></span></span><Icon name="arrow" className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-700" /></button>
  </div>;
}
