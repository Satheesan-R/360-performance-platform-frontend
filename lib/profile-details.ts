export const proficiencyLevels = ["learning", "intermediate", "advanced", "expert"] as const;
export interface ProfileDetails {
  photo: string;
  bio: string;
  skills: { name: string; proficiency: typeof proficiencyLevels[number]; developing: boolean }[];
  careerInterests: string;
  careerVisibility: "private" | "manager_hr";
  links: { label: string; url: string }[];
}
export const correctionFields = [{ key: "jobTitle", label: "Job title" }, { key: "department", label: "Department" }, { key: "reportingManager", label: "Reporting manager" }] as const;
export type CorrectionField = typeof correctionFields[number]["key"];
export interface ProfileCorrection {
  id: string; field: CorrectionField; currentValue: string; proposedValue: string; reason: string;
  status: "pending" | "approved" | "rejected"; createdAt: string; reviewedAt?: string; reviewNote?: string;
  requesterName?: string;
}
export function defaultProfileDetails(): ProfileDetails { return { photo: "", bio: "", skills: [], careerInterests: "", careerVisibility: "private", links: [] }; }
export function safeProfessionalUrl(value: string) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && Boolean(url.hostname); } catch { return false; }
}
export function validateProfileDetails(value: ProfileDetails): Record<string, string> {
  const errors: Record<string, string> = {};
  if (typeof value.bio !== "string" || value.bio.trim().length > 500) errors.bio = "Keep your bio within 500 characters.";
  if (typeof value.careerInterests !== "string" || value.careerInterests.trim().length > 1000) errors.careerInterests = "Keep career interests within 1,000 characters.";
  if (!["private", "manager_hr"].includes(value.careerVisibility)) errors.careerVisibility = "Choose a valid audience.";
  if (typeof value.photo !== "string" || value.photo.length > 180000 || (value.photo !== "" && !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value.photo))) errors.photo = "Choose a photo and apply the crop before saving.";
  if (!Array.isArray(value.skills) || value.skills.length > 20 || value.skills.some((skill) => !skill || typeof skill.name !== "string" || !skill.name.trim() || skill.name.trim().length > 60 || !proficiencyLevels.includes(skill.proficiency) || typeof skill.developing !== "boolean")) errors.skills = "Add up to 20 skills with a name and proficiency level.";
  else if (new Set(value.skills.map((skill) => skill.name.trim().toLowerCase())).size !== value.skills.length) errors.skills = "Each skill should appear only once.";
  if (!Array.isArray(value.links) || value.links.length > 5 || value.links.some((link) => !link || typeof link.label !== "string" || !link.label.trim() || link.label.trim().length > 60 || typeof link.url !== "string" || link.url.length > 500 || !safeProfessionalUrl(link.url.trim()))) errors.links = "Add up to 5 labelled HTTP or HTTPS links, without sign-in credentials.";
  return errors;
}
export function cleanProfileDetails(value: ProfileDetails): ProfileDetails {
  return { photo: value.photo, bio: value.bio.trim(), skills: value.skills.map(({ name, proficiency, developing }) => ({ name: name.trim(), proficiency, developing })), careerInterests: value.careerInterests.trim(), careerVisibility: value.careerVisibility, links: value.links.map(({ label, url }) => ({ label: label.trim(), url: url.trim() })) };
}
export function validateCorrection(value: { field: CorrectionField; proposedValue: string; reason: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!correctionFields.some(({ key }) => key === value.field)) errors.field = "Choose an employment field.";
  if (!value.proposedValue.trim() || value.proposedValue.trim().length > 120) errors.proposedValue = "Enter the correct value using at most 120 characters.";
  if (!value.reason.trim() || value.reason.trim().length > 500) errors.reason = "Explain the correction using at most 500 characters.";
  return errors;
}
