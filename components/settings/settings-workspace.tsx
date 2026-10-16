"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  createDemoSettings, employmentTypes, parseDemoSettings, roleDefinitions,
  stageLabels, validateDemoSettings,
  type DemoSettings, type EmploymentType,
  type SettingsErrors, type SettingsRole, type SettingsSection,
} from "@/lib/settings-demo";

const sections: { id: SettingsSection; label: string; detail: string; icon: string }[] = [
  { id: "general", label: "General", detail: "Your organization details", icon: "building" },
];

const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";
const secondaryClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40";

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    building: <><path d="M4 21V5l8-2 8 2v16M2 21h20M9 21v-4h6v4M8 7h1m6 0h1M8 11h1m6 0h1" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-2-4" /></>,
    workflow: <><rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="15" y="15" width="6" height="6" rx="1.5" /><path d="M9 6h6a3 3 0 0 1 3 3v6M14 11l4 4 4-4M6 9v12" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chart: <><path d="M4 3v17h17M9 16v-5m5 5V7m5 9V4" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" /><path d="m8 12 3 3 5-6" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-11v1" /></>,
    save: <><path d="M4 3h13l4 4v14H3V3h1Zm3 0v6h10V3M7 21v-8h10v8" /></>,
    up: <path d="m6 14 6-6 6 6" />,
    down: <path d="m6 10 6 6 6-6" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name] ?? paths.info}</svg>;
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div>
    <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
    {children}
    {error && <p id={`${id}-error`} className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    {hint && <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>}
  </div>;
}

function Toggle({ id, title, description, checked, onChange, disabled = false }: {
  id: string; title: string; description: string; checked: boolean;
  onChange: (value: boolean) => void; disabled?: boolean;
}) {
  return <div className="flex items-center justify-between gap-5 py-5">
    <div><label id={`${id}-label`} htmlFor={id} className="text-sm font-semibold text-slate-800">{title}</label><p id={`${id}-description`} className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>
    <button id={id} type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-label`} aria-describedby={`${id}-description`} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-blue-600" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "left-0.5 translate-x-5" : "left-0.5 translate-x-0"}`} />
    </button>
  </div>;
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-5 py-5 sm:px-7"><h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>
    <div className="p-5 sm:p-7">{children}</div>
  </section>;
}

export default function SettingsWorkspace({ role }: { role: SettingsRole }) {
  const [initial] = useState(() => ({ settings: createDemoSettings(), savedAt: "", storageKey: "", notice: "" }));
  const [saved, setSaved] = useState(initial.settings);
  const [draft, setDraft] = useState(initial.settings);
  const [savedAt, setSavedAt] = useState(initial.savedAt);
  const [section, setSection] = useState<SettingsSection>("general");
  const [employment, setEmployment] = useState<EmploymentType>("permanent");
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const isDirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const policy = draft.reviews[employment];
  const canEditRoles = role === "admin";

  function update(next: DemoSettings) {
    setDraft(next); setErrors({}); setMessage(""); setSaveError("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDemoSettings(draft);
    setErrors(nextErrors); setMessage(""); setSaveError("");
    if (Object.keys(nextErrors).length) {
      if (Object.keys(draft.general).some((key) => nextErrors[key])) setSection("general");
      else if (Object.keys(nextErrors).some((key) => key.startsWith("role."))) setSection("roles");
      else if (Object.keys(nextErrors).some((key) => key.startsWith("review."))) {
        setSection("reviews");
        setEmployment(employmentTypes.find(({ id }) => nextErrors[`review.${id}`])!.id);
      } else setSection("notifications");
      setSaveError("Check the highlighted fields before saving.");
      return;
    }
    const next = structuredClone(draft);
    for (const key of Object.keys(next.general) as (keyof DemoSettings["general"])[]) next.general[key] = next.general[key].trim();
    for (const { id } of roleDefinitions) next.roleLabels[id] = next.roleLabels[id].trim();
    // HR cannot change role labels, including values loaded from a modified demo.
    if (!canEditRoles) next.roleLabels = createDemoSettings().roleLabels;
    const timestamp = new Date().toISOString();
    setSaved(next); setDraft(next); setSavedAt(timestamp);
    setMessage("Preview settings updated for this session.");
  }

  function cancel() {
    setDraft(saved); setErrors({}); setSaveError(""); setMessage("Unsaved changes discarded.");
  }

  function fieldProps(key: string) {
    return { id: `settings-${key}`, "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `settings-${key}-error` : undefined };
  }

  return <main className="mx-auto max-w-7xl pb-4">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Workspace preferences</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Settings</h1><p className="mt-2 text-sm leading-6 text-slate-500">Shape how your organization manages people and performance.</p></div>
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"><Icon name="shield" className="h-4 w-4" />{role === "admin" ? "Admin access" : "HR access"}</span>
    </div>

    <div className="mb-7 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-blue-900">
      <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-semibold">Demo settings · saved on this browser</p><p className="mt-1 text-sm leading-6 text-blue-800">Explore with example data. Changes stay with this account on this browser and do not update your organization, permissions or review cycles.</p></div>
    </div>
    {initial.notice && <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{initial.notice}</p>}

    <form noValidate onSubmit={save}>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="min-w-0 xl:sticky xl:top-25">
          <nav aria-label="Settings sections" className="flex min-w-0 gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm xl:block xl:space-y-1">
            {sections.map((item) => <button key={item.id} type="button" aria-pressed={section === item.id} onClick={() => setSection(item.id)} className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-blue-600 xl:w-full ${section === item.id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
              <Icon name={item.icon} /><span><span className="block text-sm font-semibold">{item.label}</span><span className={`mt-1 hidden text-xs xl:block ${section === item.id ? "text-blue-600" : "text-slate-400"}`}>{item.detail}</span></span>
            </button>)}
          </nav>
          <div className="mt-5 hidden rounded-xl border border-slate-200/80 p-4 xl:block"><div className="flex items-center gap-2 text-slate-600"><Icon name="shield" className="h-4 w-4" /><p className="text-xs font-bold">Governance by default</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Rating evidence is required. Audit history remains immutable across every review workflow.</p></div>
        </aside>

        <div className="min-w-0 space-y-5">
          {section === "general" && <>
            <Panel title="Organization details" description="Keep a consistent identity across your performance workspace.">
              <div className="mb-7 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-700">{draft.general.organizationName.trim().slice(0, 2).toUpperCase() || "OR"}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{draft.general.organizationName.trim() || "Your organization"}</p><p className="mt-1 text-xs text-slate-500">Example organization profile</p></div></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="settings-organizationName" label="Organization name *" error={errors.organizationName}><input {...fieldProps("organizationName")} className={inputClass} maxLength={120} required autoComplete="organization" value={draft.general.organizationName} onChange={(event) => update({ ...draft, general: { ...draft.general, organizationName: event.target.value } })} /></Field>
                <Field id="settings-industry" label="Industry"><input id="settings-industry" className={inputClass} maxLength={120} value={draft.general.industry} onChange={(event) => update({ ...draft, general: { ...draft.general, industry: event.target.value } })} /></Field>
                <Field id="settings-contactEmail" label="Contact email *" error={errors.contactEmail}><input {...fieldProps("contactEmail")} className={inputClass} type="email" maxLength={254} required autoComplete="email" value={draft.general.contactEmail} onChange={(event) => update({ ...draft, general: { ...draft.general, contactEmail: event.target.value } })} /></Field>
                <Field id="settings-country" label="Country *" error={errors.country}><input {...fieldProps("country")} className={inputClass} maxLength={100} required autoComplete="country-name" value={draft.general.country} onChange={(event) => update({ ...draft, general: { ...draft.general, country: event.target.value } })} /></Field>
                <div className="sm:col-span-2"><Field id="settings-timezone" label="Organization timezone *" error={errors.timezone} hint="Used for the example workspace's review dates and reminders."><select {...fieldProps("timezone")} className={inputClass} required value={draft.general.timezone} onChange={(event) => update({ ...draft, general: { ...draft.general, timezone: event.target.value } })}>{["Asia/Colombo", "Asia/Kolkata", "Asia/Singapore", "Asia/Dubai", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Australia/Sydney", "UTC"].map((zone) => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}</select></Field></div>
              </div>
            </Panel>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div><h3 className="text-sm font-semibold text-slate-800">Organization structure</h3><p className="mt-1 text-sm text-slate-500">Departments, teams and reporting lines are managed in Organization.</p></div>{role === "hr" ? <Link href="/hr/organization" className={secondaryClass}>Open organization<Icon name="arrow" className="h-4 w-4" /></Link> : <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">Managed in the HR workspace</span>}</div>
          </>}


        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-7 rounded-2xl border border-slate-200 bg-white/95 px-5 py-4 shadow-[0_-4px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className={`flex items-center gap-2 text-sm font-semibold ${isDirty ? "text-amber-700" : "text-slate-600"}`}><span className={`h-2 w-2 rounded-full ${isDirty ? "bg-amber-500" : "bg-emerald-500"}`} />{isDirty ? "You have unsaved changes" : "No unsaved changes"}</p><p className="mt-1 text-xs text-slate-400">{savedAt ? `Last demo save: ${new Date(savedAt).toLocaleString()}` : "Changes apply to this browser demo only."}</p></div><div className="flex gap-3"><button type="button" onClick={cancel} disabled={!isDirty} className={secondaryClass}>Cancel</button><button type="submit" disabled={!isDirty} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40"><Icon name="save" className="h-4 w-4" />Save changes</button></div></div>
        <div aria-live="polite" aria-atomic="true">{message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}</div>
        {saveError && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{saveError}</p>}
      </div>
    </form>
  </main>;
}
