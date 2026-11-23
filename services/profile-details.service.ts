import api from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import { cleanProfileDetails, validateProfileDetails, validateCorrection, type ProfileDetails, type ProfileCorrection, type CorrectionField } from "@/lib/profile-details";
import type { SelfProfile } from "@/lib/personal-settings";

function session(expectedId: string) {
  const user = getCurrentUser(); const token = getToken();
  if (!user || !token || user.id !== expectedId) throw new Error("Your account changed or your session expired. Reload Settings before continuing.");
  return { headers: { Authorization: `Bearer ${token}` } };
}
export async function saveProfileDetails(details: ProfileDetails, expectedId: string): Promise<SelfProfile> {
  const config = session(expectedId);
  if (Object.keys(validateProfileDetails(details)).length) throw new Error("Check the highlighted profile details.");
  const { data } = await api.patch<{ profile: SelfProfile }>("/settings/profile", { details: cleanProfileDetails(details) }, config);
  session(expectedId);
  if (data.profile?.id !== expectedId || !data.profile.details || Object.keys(validateProfileDetails(data.profile.details)).length) throw new Error("Could not verify the saved profile. Reload Settings.");
  return data.profile;
}
export async function getProfileCorrections(expectedId: string, review = false, signal?: AbortSignal) {
  const config = session(expectedId);
  const { data } = await api.get<{ corrections: ProfileCorrection[] }>(review ? "/settings/corrections/review" : "/settings/corrections", { ...config, signal });
  session(expectedId);
  if (!Array.isArray(data.corrections)) throw new Error("Could not load correction requests.");
  return data.corrections;
}
export async function submitProfileCorrection(value: { field: CorrectionField; proposedValue: string; reason: string }, expectedId: string) {
  const config = session(expectedId);
  if (Object.keys(validateCorrection(value)).length) throw new Error("Check the correction details.");
  const { data } = await api.post<{ correction: ProfileCorrection }>("/settings/corrections", { field: value.field, proposedValue: value.proposedValue.trim(), reason: value.reason.trim() }, config);
  session(expectedId);
  return data.correction;
}
export async function reviewProfileCorrection(id: string, decision: "approved" | "rejected", note: string, expectedId: string) {
  const config = session(expectedId);
  const { data } = await api.patch<{ correction: ProfileCorrection }>(`/settings/corrections/${encodeURIComponent(id)}`, { decision, note: note.trim() }, config);
  session(expectedId);
  return data.correction;
}
