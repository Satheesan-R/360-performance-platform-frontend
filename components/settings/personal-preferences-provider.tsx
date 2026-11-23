"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useCurrentUser } from "@/lib/use-current-user";
import { defaultPreferences, type AppearancePreferences, type PersonalPreferences, type ThemeMode } from "@/lib/personal-settings";
import { getSelfPreferences, saveSelfPreferences, type PreferenceSource } from "@/services/personal-settings.service";
import { getApiErrorMessage } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

interface PreferenceContext {
  user: AuthUser | null; preferences: PersonalPreferences; source: PreferenceSource | null;
  loading: boolean; error: string; notice: string;
  previewTheme: (theme: ThemeMode | null) => void;
  previewAppearance: (appearance: AppearancePreferences | null) => void;
  save: (value: PersonalPreferences) => Promise<PersonalPreferences>;
  reload: () => void;
}
const Context = createContext<PreferenceContext | null>(null);
export function usePersonalPreferences() { const value = useContext(Context); if (!value) throw new Error("Personal preferences provider is missing"); return value; }

export default function PersonalPreferencesProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  return <PreferenceSession key={`${user?.role}:${user?.id}`} user={user}>{children}</PreferenceSession>;
}
function PreferenceSession({ user, children }: { user: AuthUser | null; children: ReactNode }) {
  const [preferences, setPreferences] = useState(() => defaultPreferences(user?.role ?? "employee"));
  const [source, setSource] = useState<PreferenceSource | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [themePreview, setThemePreview] = useState<ThemeMode | null>(null);
  const [appearancePreview, setAppearancePreview] = useState<AppearancePreferences | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    getSelfPreferences(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setPreferences(result.preferences); setSource(result.source); setNotice(result.notice); setError("");
    }).catch((reason) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user, reloadIndex]);
  useEffect(() => {
    document.documentElement.dataset.theme = themePreview ?? preferences.theme;
    return () => { document.documentElement.dataset.theme = "system"; };
  }, [themePreview, preferences.theme]);
  useEffect(() => {
    const root = document.documentElement;
    const appearance = appearancePreview ?? preferences.appearance;
    root.dataset.accent = appearance.accent;
    root.dataset.motion = appearance.reduceMotion;
    root.dataset.contrast = appearance.contrast;
    if (Number.isInteger(appearance.fontSize) && appearance.fontSize >= 14 && appearance.fontSize <= 18) root.style.fontSize = `${appearance.fontSize}px`;
    return () => {
      delete root.dataset.accent; delete root.dataset.motion; delete root.dataset.contrast;
      root.style.removeProperty("font-size");
    };
  }, [appearancePreview, preferences.appearance]);
  async function save(value: PersonalPreferences) {
    if (!user || !source) throw new Error("Load your preferences before saving.");
    const result = await saveSelfPreferences(value, source, user.id);
    setPreferences(result); setThemePreview(null); setAppearancePreview(null);
    return result;
  }
  return <Context.Provider value={{ user, preferences, source, loading, error, notice, previewTheme: setThemePreview, previewAppearance: setAppearancePreview, save, reload: () => { setLoading(true); setError(""); setReloadIndex((value) => value + 1); } }}>{children}</Context.Provider>;
}
