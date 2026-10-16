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
  { id: "roles", label: "Roles & access", detail: "Labels and permissions", icon: "people" },
  { id: "reviews", label: "Review policies", detail: "How your reviews flow", icon: "workflow" },
  { id: "notifications", label: "Notifications", detail: "Keep everyone up to date", icon: "bell" },
  { id: "performance", label: "Performance", detail: "Frameworks and governance", icon: "chart" },
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
