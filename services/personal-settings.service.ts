import { isAxiosError } from "axios";
import api from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import { cleanPreferences, defaultPreferences, notificationDeliveryKey, parsePreferences, preferenceKey, type PersonalPreferences, type SelfProfile } from "@/lib/personal-settings";

function session() {
  const user = getCurrentUser(); const token = getToken();
  if (!user || !token) throw new Error("Your session has expired. Please sign in again.");
  return { user, config: { headers: { Authorization: `Bearer ${token}` } } };
}
function sameAccount(expectedId: string) { const current = session(); if (current.user.id !== expectedId) throw new Error("Your signed-in account changed. Reload Settings before saving."); return current; }
export async function getSelfProfile(signal?: AbortSignal) {
  const { user, config } = session();
  const { data } = await api.get<{ profile: SelfProfile }>("/settings/profile", { ...config, signal });
  if (data.profile?.id !== user.id || data.profile.role !== user.role) throw new Error("Profile identity does not match your signed-in account. Sign in again.");
  return data.profile;
}
export async function updateSelfProfile(values: { phone?: string; address?: string }, expectedId: string) {
  const { config } = sameAccount(expectedId);
  const body = { ...(values.phone === undefined ? {} : { phone: values.phone.trim() }), ...(values.address === undefined ? {} : { address: values.address.trim() }) };
  const { data } = await api.patch<{ profile: SelfProfile }>("/settings/profile", body, config);
  if (data.profile?.id !== expectedId) throw new Error("Unexpected profile response. Reload your profile to verify the update.");
  return data.profile;
}
export async function changeSelfPassword(currentPassword: string, newPassword: string, expectedId: string) {
  const { config } = sameAccount(expectedId);
  // Passwords are request-local only. Never persist, cache, dispatch or log them.
  await api.patch("/settings/password", { currentPassword, newPassword }, config);
}
export type PreferenceSource = "server" | "browser";
export async function getSelfPreferences(signal?: AbortSignal): Promise<{ preferences: PersonalPreferences; source: PreferenceSource; notice: string }> {
  const { user, config } = session();
  try {
    const { data } = await api.get<{ preferences: PersonalPreferences }>("/settings/preferences", { ...config, signal });
    const preferences = parsePreferences(data.preferences, user.role);
    if (!preferences) throw new Error("The server returned unsupported preferences. Try again or contact IT.");
    sameAccount(user.id);
    let notice = "";
    try {
      const raw = localStorage.getItem(notificationDeliveryKey(user.id));
      if (raw) {
        const merged = parsePreferences({ ...preferences, notifications: { ...preferences.notifications, delivery: JSON.parse(raw) } }, user.role);
        if (merged) return { preferences: merged, source: "server", notice };
        notice = "Invalid browser notification options were reset to defaults.";
      }
    } catch { notice = "Browser notification options could not be loaded. Defaults are shown."; }
    return { preferences, source: "server", notice };
  } catch (error) {
    if (!isAxiosError(error) || ![404, 501].includes(error.response?.status ?? 0)) throw error;
    let preferences = defaultPreferences(user.role); let notice = "Preferences API is unavailable on this server. Changes are a browser-only preview.";
    try {
      const raw = localStorage.getItem(preferenceKey(user.id));
      if (raw) { const parsed = parsePreferences(JSON.parse(raw), user.role); if (parsed) preferences = parsed; else notice += " Invalid browser preferences were reset."; }
    } catch { notice += " Browser storage is unavailable."; }
    return { preferences, source: "browser", notice };
  }
}
export async function saveSelfPreferences(value: PersonalPreferences, source: PreferenceSource, expectedId: string) {
  const { user, config } = sameAccount(expectedId);
  const body = cleanPreferences(value);
  if (!parsePreferences(body, user.role)) throw new Error("Check the highlighted preferences before saving.");
  if (source === "browser") {
    try { localStorage.setItem(preferenceKey(user.id), JSON.stringify(body)); } catch { throw new Error("Your browser could not save the preview. Your edits are still here."); }
    return body;
  }
  // The current API accepts only the five basic notification booleans.
  // Keep advanced delivery choices account-scoped in this browser until the API supports them.
  const { email, goals, reviews, feedback, development } = body.notifications;
  const serverBody = { ...body, notifications: { email, goals, reviews, feedback, development } };
  const { data } = await api.patch<{ preferences: PersonalPreferences }>("/settings/preferences", serverBody, config);
  const result = parsePreferences(data.preferences, user.role);
  if (!result) throw new Error("Could not verify the saved server preferences. Reload Settings.");
  sameAccount(expectedId);
  try { localStorage.setItem(notificationDeliveryKey(user.id), JSON.stringify(body.notifications.delivery)); }
  catch { throw new Error("Account preferences were saved, but advanced notification options could not be saved in this browser. Your edits are still here; enable browser storage and try again."); }
  return { ...result, notifications: { ...result.notifications, delivery: body.notifications.delivery } };
}
