"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { clearSession, getDashboardPath } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { landingPages, roleNames, validatePreferences, type SelfProfile } from "@/lib/personal-settings";
import { getSelfProfile } from "@/services/personal-settings.service";
import { usePersonalPreferences } from "./personal-preferences-provider";
import PersonalSecurity from "./personal-security";
import PersonalAppearance from "./personal-appearance";
import PersonalNotifications from "./personal-notifications";
import PersonalProfile from "./personal-profile";
import { ProfileAvatar } from "./profile-photo-editor";
import { Field, Icon, inputClass, secondaryClass } from "./settings-ui";

const sections = [
  { id: "general", label: "General", icon: "building" }, { id: "appearance", label: "Appearance", icon: "appearance" },
  { id: "notifications", label: "Notifications", icon: "bell" }, { id: "profile", label: "Profile", icon: "people" },
  { id: "security", label: "Security and Login", icon: "key" }, { id: "account", label: "Account", icon: "account" },
  { id: "privacy", label: "Privacy and Activity", icon: "shield" }, { id: "devices", label: "Devices and Sessions", icon: "devices" },
] as const;
type Section = typeof sections[number]["id"];
const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40";

interface PersonalSettingsProps { onClose?: () => void; registerCloseHandler?: (handler: (() => void) | null) => void }
export default function PersonalSettings(props: PersonalSettingsProps) {
  const context = usePersonalPreferences();
  if (!context.user || context.loading) return <div className={`flex items-center justify-center bg-slate-50 ${props.onClose ? "h-full" : "min-h-screen"}`}><p role="status" className="text-sm text-slate-500">Loading personal settings…</p>{props.onClose && <button type="button" aria-label="Close settings" className="absolute right-4 top-4 rounded-lg p-2 text-slate-600" onClick={props.onClose}>×</button>}</div>;
  return <PersonalSettingsContent key={`${context.user.role}:${context.user.id}`} {...props} />;
}
function PersonalSettingsContent({ onClose, registerCloseHandler }: PersonalSettingsProps) {
  const context = usePersonalPreferences(); const user = context.user!; const router = useRouter();
  const [section, setSection] = useState<Section>("general");
  const [draft, setDraft] = useState(context.preferences);
  const [profile, setProfile] = useState<SelfProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true); const [profileError, setProfileError] = useState(""); const [profileReload, setProfileReload] = useState(0);
  const [dirtyProfile, setDirtyProfile] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<"preferences" | "profile" | null>(null);
  const setProfileBusy = useCallback((busy: boolean) => setSaving((current) => busy ? "profile" : current === "profile" ? null : current), []);
  const [passwordDirty, setPasswordDirty] = useState(false); const [passwordBusy, setPasswordBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const dirtyPreferences = JSON.stringify(draft) !== JSON.stringify(context.preferences);
  const hasUnsaved = dirtyPreferences || dirtyProfile || passwordDirty;
  const previewTheme = context.previewTheme;
  const previewAppearance = context.previewAppearance;

  function requestClose() {
    if (saving || passwordBusy) return;
    if (hasUnsaved && !window.confirm("Close Settings? Unsaved preferences, profile edits and entered passwords will be discarded.")) return;
    onClose?.();
  }
  useEffect(() => {
    registerCloseHandler?.(() => {
      if (saving || passwordBusy) return;
      if (hasUnsaved && !window.confirm("Close Settings? Unsaved preferences, profile edits and entered passwords will be discarded.")) return;
      onClose?.();
    });
    return () => registerCloseHandler?.(null);
  }, [registerCloseHandler, onClose, hasUnsaved, saving, passwordBusy]);

  useEffect(() => {
    const controller = new AbortController();
    getSelfProfile(controller.signal).then((result) => { if (!controller.signal.aborted) { setProfile(result); setProfileError(""); } }).catch((reason) => { if (!controller.signal.aborted) setProfileError(getApiErrorMessage(reason)); }).finally(() => { if (!controller.signal.aborted) setProfileLoading(false); });
    return () => controller.abort();
  }, [profileReload]);
  useEffect(() => () => { previewTheme(null); previewAppearance(null); }, [previewTheme, previewAppearance]);
  useEffect(() => {
    if (!hasUnsaved) return;
    function beforeUnload(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ""; }
    function beforeNavigate(event: MouseEvent) {
      if (!(event.target instanceof Element) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (link && link.target !== "_blank" && link.origin === location.origin && link.pathname !== location.pathname && !window.confirm("Leave Settings? Unsaved preferences, profile edits and entered passwords will be discarded.")) { event.preventDefault(); event.stopPropagation(); }
    }
    window.addEventListener("beforeunload", beforeUnload); document.addEventListener("click", beforeNavigate, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", beforeNavigate, true); };
  }, [hasUnsaved]);

  function navigate(next: Section) {
    if (section === next || saving || passwordBusy) return;
    if (passwordDirty && !window.confirm("Discard entered passwords? They are cleared when leaving Security and Login.")) return;
    setPasswordDirty(false); setSection(next); setErrors({}); setError(""); setMessage("");
  }
  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const validation = validatePreferences(draft, user.role); setErrors(validation);
    if (Object.keys(validation).length) { setSection((validation.theme || validation.appearance) ? "appearance" : validation.notifications ? "notifications" : "general"); requestAnimationFrame(() => document.getElementById(`personal-${Object.keys(validation)[0]}`)?.focus()); return; }
    setSaving("preferences");
    try { const result = await context.save(draft); setDraft(result); setMessage(context.source === "server" ? "Account preferences saved. Advanced notification options are saved in this browser only." : "Preview preferences saved in this browser only. Your server account was not changed."); }
    catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setSaving(null); }
  }
  const employee = profile?.employee;
  const fullName = employee ? [employee.firstName, employee.lastName].filter(Boolean).join(" ") : user.email;
  const initials = employee ? `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase() : user.email.slice(0, 2).toUpperCase();
  const timezones = [...new Set([draft.timezone, "UTC", ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Asia/Colombo", "Europe/London", "America/New_York"])])];
  const showProfileState = ["profile", "security", "account", "privacy", "devices"].includes(section);
  const preferenceSection = ["general", "appearance", "notifications"].includes(section);
  const resetPreferences = () => { setDraft(context.preferences); previewTheme(null); previewAppearance(null); setErrors({}); setError(""); setMessage("Unsaved preferences discarded."); };

  const Container = onClose ? "div" : "main";
  return <Container className={onClose ? "h-full min-h-0 text-slate-900" : "min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-8 sm:py-10"}>
    {!onClose && <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3"><Link href={getDashboardPath(user.role)} className="inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"><span aria-hidden="true">←</span> Back to workspace</Link><span className="text-xs text-slate-500">Personal Settings</span></div>}
    <div className={onClose ? "flex h-full min-h-0 flex-col overflow-hidden bg-white" : "mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"}>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1><p className="mt-1 text-sm text-slate-500">Manage your personal account and preferences</p></div><div className="flex shrink-0 items-center gap-3"><ProfileAvatar photo={profile?.details?.photo} name={fullName} initials={initials} />{onClose && <button type="button" aria-label="Close settings" disabled={Boolean(saving) || passwordBusy} onClick={requestClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40"><span aria-hidden="true">×</span></button>}</div></header>
      <div className={`grid items-start md:grid-cols-[260px_minmax(0,1fr)] ${onClose ? "min-h-0 flex-1 overflow-y-auto overscroll-contain" : "min-h-[570px]"}`}>
        <aside className={`min-w-0 p-3 sm:p-4 md:py-6 ${onClose ? "sticky top-0 z-10 bg-white" : ""}`}><nav aria-label="Personal settings sections" className="flex gap-1 overflow-x-auto md:block md:space-y-1">{sections.map((item) => <button key={item.id} type="button" disabled={Boolean(saving) || passwordBusy} aria-pressed={section === item.id} onClick={() => navigate(item.id)} className={`flex min-w-max items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 md:w-full ${section === item.id ? "bg-blue-50 font-semibold text-blue-700" : "font-medium text-slate-600 hover:bg-slate-50"}`}><Icon name={item.icon} className="h-4 w-4 shrink-0" />{item.label}</button>)}</nav></aside>
        <section aria-labelledby="personal-section-heading" className="min-w-0 px-6 pb-7 pt-3 sm:px-8 md:py-7"><h2 id="personal-section-heading" className="border-b border-slate-200 pb-5 text-lg font-semibold text-slate-900">{sections.find(({ id }) => id === section)?.label}</h2>
          {context.notice && preferenceSection && <p role="status" className="mt-5 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">{context.notice}</p>}
          {context.error && preferenceSection && <div className="mt-5 rounded-xl bg-red-50 p-4"><p role="alert" className="text-sm text-red-600">Preferences could not be loaded: {context.error}</p><button type="button" className={`${secondaryClass} mt-3`} onClick={context.reload}>Try again</button></div>}
          {showProfileState && profileError && <div className="mt-5 rounded-xl bg-red-50 p-4"><p role="alert" className="text-sm text-red-600">Your profile could not be loaded: {profileError}</p><button type="button" className={`${secondaryClass} mt-3`} onClick={() => { setProfileLoading(true); setProfileError(""); setProfileReload(profileReload + 1); }}>Retry profile</button></div>}
          <form id="personal-preferences-form" noValidate onSubmit={savePreferences} />
          <div className="mt-6">
            {section === "general" && <fieldset disabled={!context.source || Boolean(saving)} className="space-y-5"><Field id="personal-language" label="Language" error={errors.language} hint="English is currently the only supported language."><select form="personal-preferences-form" id="personal-language" className={inputClass} value={draft.language} aria-describedby="personal-language-hint" onChange={() => setDraft({ ...draft, language: "en" })}><option value="en">English</option></select></Field><Field id="personal-timezone" label="Time zone" error={errors.timezone} hint="Used for your personal display preferences. Organization schedules are unchanged."><select form="personal-preferences-form" id="personal-timezone" className={inputClass} value={draft.timezone} aria-invalid={Boolean(errors.timezone)} aria-describedby={errors.timezone ? "personal-timezone-error" : "personal-timezone-hint"} onChange={(event) => { setDraft({ ...draft, timezone: event.target.value }); setErrors({}); }}>{timezones.map((zone) => <option key={zone}>{zone}</option>)}</select></Field><Field id="personal-landingPage" label="Default landing page" error={errors.landingPage}><select form="personal-preferences-form" id="personal-landingPage" className={inputClass} value={draft.landingPage} onChange={(event) => setDraft({ ...draft, landingPage: event.target.value })}>{landingPages[user.role].map(({ href, label }) => <option key={href} value={href}>{label}</option>)}</select></Field></fieldset>}
            {section === "appearance" && <PersonalAppearance theme={draft.theme} value={draft.appearance} disabled={!context.source || Boolean(saving)} error={errors.appearance || errors.theme} onChange={(theme, appearance) => { setDraft({ ...draft, theme, appearance }); previewTheme(theme); previewAppearance(appearance); setErrors({}); setMessage(""); }} />}
            {section === "notifications" && <PersonalNotifications value={draft.notifications} role={user.role} timezone={draft.timezone} disabled={!context.source || Boolean(saving)} error={errors.notifications} onChange={(notifications) => { setDraft((previous) => ({ ...previous, notifications })); setErrors({}); setMessage(""); }} />}
            {profile && <div hidden={section !== "profile"}><PersonalProfile profile={profile} timezone={context.preferences.timezone} onDirty={setDirtyProfile} onBusy={setProfileBusy} onSaved={setProfile} /></div>}
            {section === "profile" && (profileLoading ? <p role="status" className="text-sm text-slate-500">Loading your profile…</p> : !profile && <p className="text-sm text-slate-500">Your employee profile is unavailable.</p>)}
            {section === "security" && <PersonalSecurity profile={profile} loading={profileLoading} onDirty={setPasswordDirty} onBusy={setPasswordBusy} />}
            {section === "account" && <div className="space-y-6"><div><h3 className="text-sm font-semibold text-slate-800">Account information</h3><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-500">Account ID</dt><dd className="mt-1 break-all font-medium text-slate-800">{user.id}</dd></div><div><dt className="text-slate-500">Role</dt><dd className="mt-1 font-medium text-slate-800">{roleNames[profile?.role ?? user.role]}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium capitalize text-slate-800">{profileLoading ? "Loading…" : profile?.status || "Unavailable"}</dd></div></dl></div><div className="border-t border-slate-200 pt-5"><h3 className="text-sm font-semibold text-slate-800">Account assistance</h3><p className="mt-2 text-sm leading-6 text-slate-500">Contact HR or IT through your organization’s usual support channel. Role assignments and account deactivation are managed by authorized staff.</p><button type="button" className={`${secondaryClass} mt-4`} aria-expanded={help} onClick={() => setHelp(!help)}>Get account support</button>{help && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600"><p>When requesting support, include your account ID and describe the problem. Never send your password or sign-in token.</p><p className="mt-2 break-all">Account ID: {user.id}</p><p className="mt-2">This page does not send a support request. Use your established HR or IT channel.</p></div>}</div></div>}
            {section === "privacy" && <div className="space-y-6"><div><h3 className="text-sm font-semibold text-slate-800">Access to your information</h3><p className="mt-3 text-sm leading-6 text-slate-500">This page reads only your linked employee profile. Employment changes remain in authorized HR workflows. Access to employees and performance records is controlled by each module’s backend role and scope checks; personal preferences grant no additional access.</p><p className="mt-3 text-xs leading-5 text-slate-500">Peer reviewers use their normal sign-in account. A peer-review assignment does not create a separate system role or access to confidential audit records.</p></div><div className="border-t border-slate-200 pt-5"><h3 className="text-sm font-semibold text-slate-800">Recent account activity</h3>{profileLoading ? <p role="status" className="mt-3 text-sm text-slate-500">Loading your security activity…</p> : profile?.lastLoginAt || profile?.passwordChangedAt ? <ul className="mt-3 space-y-3">{[{ date: profile.lastLoginAt, label: "Last successful sign-in" }, { date: profile.passwordChangedAt, label: "Last password change" }].filter(({ date }) => date).map(({ date, label }) => <li key={label} className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-800">{label}</p><p className="mt-1 text-xs text-slate-500">{new Date(date!).toLocaleString("en", { timeZone: context.preferences.timezone })} · {context.preferences.timezone}</p></li>)}</ul> : <p role="status" className="mt-3 text-sm leading-6 text-slate-500">No personal security activity is available from the server.</p>}<p className="mt-4 text-xs leading-5 text-slate-500">Only your available personal security timestamps are shown. Organization audit records and other employees’ activity are not fetched.</p></div></div>}
            {section === "devices" && <div className="space-y-5"><h3 className="text-sm font-semibold text-slate-800">Signed-in devices</h3><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-3"><Icon name="devices" /><div><p className="text-sm font-semibold text-slate-800">This browser</p><p className="mt-1 text-xs text-slate-500">Your current local sign-in</p></div></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Current device</span></div><p className="text-sm leading-6 text-slate-500">The current backend does not provide a session inventory or remote-session revocation. No example device is presented as a real active session.</p><div className="flex flex-wrap gap-3"><button type="button" disabled className={secondaryClass}>Sign out of other sessions</button><button type="button" className={secondaryClass} onClick={() => { if (hasUnsaved && !window.confirm("Sign out and discard unsaved changes?")) return; clearSession(); router.replace("/login"); }}>Sign out of this browser</button></div><p className="text-xs leading-5 text-slate-500">Signing out clears this browser’s sign-in. It does not revoke tokens on other devices.</p></div>}
          </div>
          {preferenceSection && <div className="mt-7 flex flex-wrap items-center justify-end gap-3">{dirtyPreferences && <button type="button" className={secondaryClass} disabled={Boolean(saving)} onClick={resetPreferences}>Cancel</button>}<button type="submit" form="personal-preferences-form" className={primaryClass} disabled={!context.source || !dirtyPreferences || Boolean(saving)}><Icon name="save" className="h-4 w-4" />{saving === "preferences" ? "Saving preferences…" : "Save preferences"}</button></div>}
          <div aria-live="polite" aria-atomic="true">{message && <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p>}</div>{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
          {!preferenceSection && dirtyPreferences && <p className="mt-6 text-xs text-slate-500">You have unsaved personal preferences. Return to General, Appearance or Notifications to save them.</p>}
        </section>
      </div>
    </div>
  </Container>;
}
