import type { UserRole } from "@/types/auth";

export type SettingsRole = Extract<UserRole, "hr" | "admin">;
export type SettingsSection = "general" | "roles" | "reviews" | "notifications" | "performance";
export type ReviewerStage = "self" | "peer" | "manager";
export type EmploymentType = "intern" | "probationary" | "permanent";

export const employmentTypes: { id: EmploymentType; label: string; description: string }[] = [
  { id: "intern", label: "Intern", description: "Internship review" },
  { id: "probationary", label: "Probationary", description: "Probation review" },
  { id: "permanent", label: "Permanent", description: "Annual review" },
];

export const roleDefinitions: { id: UserRole; label: string; access: string }[] = [
  { id: "admin", label: "Admin", access: "Organization settings and role configuration" },
  { id: "hr", label: "HR", access: "People, frameworks, review cycles and governance" },
  { id: "department_manager", label: "Department Manager", access: "Team goals, assigned reviews and team performance" },
  { id: "tech_lead", label: "Tech Lead", access: "Assigned team reviews and technical evaluations" },
  { id: "employee", label: "Employee", access: "Own goals, self reviews, results and development" },
];

export const stageLabels: Record<ReviewerStage, string> = {
  self: "Self review", peer: "Peer review", manager: "Manager review",
};

export interface ReviewPolicy {
  stages: ReviewerStage[];
  calibration: boolean;
}

export interface DemoSettings {
  general: {
    organizationName: string;
    industry: string;
    contactEmail: string;
    country: string;
    timezone: string;
  };
  roleLabels: Record<UserRole, string>;
  reviews: Record<EmploymentType, ReviewPolicy>;
  notifications: {
    email: boolean;
    inApp: boolean;
    reviewAssigned: boolean;
    deadlineReminder: boolean;
    overdueReminder: boolean;
    reminderDays: string;
  };
}

export function createDemoSettings(): DemoSettings {
  return {
    general: {
      organizationName: "Example organization",
      industry: "Information technology",
      contactEmail: "hr@example.com",
      country: "Sri Lanka",
      timezone: "Asia/Colombo",
    },
    roleLabels: {
      admin: "Admin", hr: "HR", department_manager: "Department Manager",
      tech_lead: "Tech Lead", employee: "Employee",
    },
    reviews: {
      intern: { stages: ["manager"], calibration: false },
      probationary: { stages: ["self", "manager"], calibration: false },
      permanent: { stages: ["self", "peer", "manager"], calibration: true },
    },
    notifications: {
      email: true, inApp: true, reviewAssigned: true,
      deadlineReminder: true, overdueReminder: true, reminderDays: "3",
    },
  };
}

export type SettingsErrors = Partial<Record<string, string>>;

export function validateDemoSettings(settings: DemoSettings): SettingsErrors {
  const errors: SettingsErrors = {};
  const { general, roleLabels, reviews, notifications } = settings;
  if (!general.organizationName.trim() || general.organizationName.trim().length > 120) {
    errors.organizationName = "Enter an organization name of 1–120 characters.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(general.contactEmail.trim())) {
    errors.contactEmail = "Enter a valid contact email address.";
  }
  if (!general.country.trim()) errors.country = "Enter your organization's country.";
  if (!general.timezone.trim()) errors.timezone = "Choose a timezone.";
  else {
    try { new Intl.DateTimeFormat("en", { timeZone: general.timezone }); }
    catch { errors.timezone = "Choose a valid timezone."; }
  }
  const labels = roleDefinitions.map(({ id }) => roleLabels[id].trim().toLowerCase());
  for (const { id } of roleDefinitions) {
    const label = roleLabels[id].trim();
    if (!label || label.length > 40) errors[`role.${id}`] = "Use a label of 1–40 characters.";
    else if (labels.filter((value) => value === label.toLowerCase()).length > 1) {
      errors[`role.${id}`] = "Each role must have a unique label.";
    }
  }
  for (const { id } of employmentTypes) {
    const stages = reviews[id].stages;
    if (!stages.includes("manager") || new Set(stages).size !== stages.length ||
        stages.some((stage) => typeof stage !== "string" || !Object.prototype.hasOwnProperty.call(stageLabels, stage))) {
      errors[`review.${id}`] = "The workflow must include one manager review and no repeated stages.";
    }
  }
  if (notifications.deadlineReminder &&
      (!/^\d+$/.test(notifications.reminderDays) || Number(notifications.reminderDays) < 1 || Number(notifications.reminderDays) > 30)) {
    errors.reminderDays = "Enter a whole number from 1 to 30 days.";
  }
  if ((notifications.reviewAssigned || notifications.deadlineReminder || notifications.overdueReminder) &&
      !notifications.email && !notifications.inApp) {
    errors.channels = "Enable at least one delivery channel for your selected notifications.";
  }
  return errors;
}

// Check browser data before using it. This is a demo format, not an API contract.
export function parseDemoSettings(raw: string): { settings: DemoSettings; savedAt: string } | null {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || typeof value.savedAt !== "string" || !Number.isFinite(Date.parse(value.savedAt))) return null;
    const settings = value.settings;
    const defaults = createDemoSettings();
    if (!settings || typeof settings !== "object") return null;
    for (const key of Object.keys(defaults.general)) {
      if (typeof settings.general?.[key] !== "string") return null;
    }
    for (const { id } of roleDefinitions) {
      if (typeof settings.roleLabels?.[id] !== "string") return null;
    }
    for (const { id } of employmentTypes) {
      if (!Array.isArray(settings.reviews?.[id]?.stages) || typeof settings.reviews[id].calibration !== "boolean") return null;
    }
    for (const [key, defaultValue] of Object.entries(defaults.notifications)) {
      if (typeof settings.notifications?.[key] !== typeof defaultValue) return null;
    }
    if (Object.keys(validateDemoSettings(settings)).length) return null;
    return { settings, savedAt: value.savedAt };
  } catch { return null; }
}
