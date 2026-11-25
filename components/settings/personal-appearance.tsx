"use client";

import { useEffect, useState, type ReactNode } from "react";
import { defaultAppearance, type AppearancePreferences, type ThemeMode } from "@/lib/personal-settings";
import { inputClass, Toggle } from "./settings-ui";
import styles from "./personal-appearance.module.css";

const modes = [{ id: "system", label: "System" }, { id: "light", label: "Light" }, { id: "dark", label: "Dark" }] as const;
const accents = { blue: "#2563eb", teal: "#0f766e", violet: "#7c3aed" };

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-4"><div><p className="text-sm font-semibold text-slate-800">{title}</p>{hint && <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{hint}</p>}</div>{children}</div>;
}
function Miniature({ dark = false }: { dark?: boolean }) {
  return <span className={`${styles.miniature} ${dark ? styles.dark : ""}`}><span className={styles.miniSidebar}><i /><i /><i /></span><span className={styles.miniContent}><i /><i /><i /><b /><span /></span></span>;
}
export default function PersonalAppearance({ theme, value, disabled, error, onChange }: {
  theme: ThemeMode; value: AppearancePreferences; disabled: boolean; error?: string;
  onChange: (theme: ThemeMode, value: AppearancePreferences) => void;
}) {
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(query.matches);
    update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update);
  }, []);
  const dark = theme === "dark" || theme === "system" && systemDark;
  const high = value.contrast === "high";
  const background = high ? dark ? "#000000" : "#FFFFFF" : dark ? "#0B1220" : "#F8FAFC";
  const foreground = high ? dark ? "#FFFFFF" : "#000000" : dark ? "#F1F5F9" : "#0F172A";
  function change(patch: Partial<AppearancePreferences>) { onChange(theme, { ...value, ...patch }); }
  return <fieldset disabled={disabled} className="min-w-0 space-y-5 disabled:opacity-60">
    <legend className="mb-4 text-base font-semibold text-slate-900">Visual style</legend>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4">
      <span id="appearance-mode-label" className="text-sm font-semibold text-slate-800">Mode</span>
      <div role="radiogroup" aria-labelledby="appearance-mode-label" className="flex gap-3">
        {modes.map(({ id, label }) => <label key={id} className={styles.mode}>
          <input form="personal-preferences-form" type="radio" name="personal-theme" value={id} checked={theme === id} onChange={() => onChange(id, value)} className="peer sr-only" />
          <span className={`${styles.preview} border-slate-200 peer-checked:border-blue-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-blue-600`} aria-hidden="true">
            {id === "system" ? <span className={styles.split}><Miniature /><Miniature dark /></span> : <Miniature dark={id === "dark"} />}
          </span><span className={`text-sm ${theme === id ? "font-semibold text-blue-700" : "text-slate-500"}`}>{label}</span>
        </label>)}
      </div>
    </div>
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
      <Row title="Theme" hint="The shared design used across your workspace."><span className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700">360 Corporate</span></Row>
      <Row title="Accent"><div className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: accents[value.accent] }} /><select aria-label="Accent color" form="personal-preferences-form" className={`${inputClass} !mt-0 !w-auto !rounded-full !py-1.5`} value={value.accent} onChange={(event) => change({ accent: event.target.value as AppearancePreferences["accent"] })}>{Object.keys(accents).map((accent) => <option key={accent} value={accent}>{accent[0].toUpperCase() + accent.slice(1)}</option>)}</select></div></Row>
      <Row title="Background"><span className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700"><span aria-hidden="true" className="h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: background }} />{background}</span></Row>
      <Row title="Foreground"><span className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700"><span aria-hidden="true" className="h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: foreground }} />{foreground}</span></Row>
    </div>
    <p className="text-sm leading-6 text-slate-500">Colors follow your mode and contrast settings to keep text readable. System mode follows your device. Changes preview across the application; save to keep them.</p>
    <details className="group">
      <summary className="w-fit cursor-pointer rounded text-base font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600">Advanced</summary>
      <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
        <Row title="UI font size" hint="Adjust the base text size across the application (14–18 px)."><label className="flex items-center gap-2 text-sm text-slate-500"><input id="personal-appearance" aria-label="UI font size" form="personal-preferences-form" type="number" min={14} max={18} step={1} required value={Number.isFinite(value.fontSize) ? value.fontSize : ""} aria-invalid={Boolean(error)} aria-describedby={error ? "appearance-error" : undefined} className={`${inputClass} !mt-0 !w-20 !py-1.5`} onChange={(event) => change({ fontSize: event.target.valueAsNumber })} />px</label></Row>
        <Row title="Reduce motion" hint="Reduce animations, or follow your device preference."><div role="group" aria-label="Reduce motion" className="flex flex-wrap gap-1 rounded-full bg-slate-50 p-1">{(["system", "on", "off"] as const).map((mode) => <button key={mode} type="button" aria-pressed={value.reduceMotion === mode} onClick={() => change({ reduceMotion: mode })} className={`rounded-full px-3 py-1.5 text-sm capitalize focus-visible:outline-2 focus-visible:outline-blue-600 ${value.reduceMotion === mode ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-500"}`}>{mode}</button>)}</div></Row>
        <Toggle id="appearance-contrast" title="Higher contrast" description="Use stronger text, borders and background contrast." checked={high} disabled={disabled} onChange={(checked) => change({ contrast: checked ? "high" : "standard" })} />
      </div>
    </details>
    {error && <p id="appearance-error" role="alert" className="text-sm text-red-600">{error}</p>}
    <button type="button" className="rounded text-sm font-semibold text-blue-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => onChange("system", defaultAppearance())}>Reset appearance to defaults</button>
  </fieldset>;
}
