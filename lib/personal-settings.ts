import type { UserRole } from "@/types/auth";
import type { ProfileDetails } from "@/lib/profile-details";

export type ThemeMode = "light" | "dark" | "system";
export interface AppearancePreferences {
  accent: "blue" | "teal" | "violet";
  fontSize: number;
  reduceMotion: "system" | "on" | "off";
  contrast: "standard" | "high";
}
export function defaultAppearance(): AppearancePreferences { return { accent: "blue", fontSize: 16, reduceMotion: "system", contrast: "standard" }; }
export const notificationCategories = [
  { key: "goals", title: "Goals and OKRs" }, { key: "reviews", title: "Performance reviews" },
  { key: "feedback", title: "Feedback" }, { key: "development", title: "Learning and development" },
  { key: "mentions", title: "Mentions and replies" }, { key: "approvals", title: "Approvals and status changes" },
  { key: "manager", title: "Manager alerts" },
] as const;
export type NotificationCategory = typeof notificationCategories[number]["key"];
export interface NotificationDelivery {
  frequency: "instant" | "daily" | "weekly";
  digestTime: string;
  digestDay: number;
  channels: Record<NotificationCategory, { email: boolean; inApp: boolean }>;
  reminders: { enabled: boolean; daysBefore: number; time: string; weekdaysOnly: boolean; overdue: boolean };
  mentions: { direct: boolean; replies: boolean };
  approvals: { requests: boolean; decisions: boolean; statusChanges: boolean };
  manager: { pendingApprovals: boolean; overdueReviews: boolean; goalRisks: boolean };
}
type BasicNotifications = { email: boolean; goals: boolean; reviews: boolean; feedback: boolean; development: boolean };
export type NotificationPreferences = BasicNotifications & { delivery: NotificationDelivery };
export function defaultNotificationDelivery(basic?: BasicNotifications): NotificationDelivery {
  const channels = Object.fromEntries(notificationCategories.map(({ key }) => {
    const enabled = !basic || !(key in basic) || basic[key as keyof BasicNotifications];
    return [key, { email: enabled, inApp: enabled }];
  })) as NotificationDelivery["channels"];
  return { frequency: "instant", digestTime: "09:00", digestDay: 1, channels,
    reminders: { enabled: true, daysBefore: 3, time: "09:00", weekdaysOnly: false, overdue: true },
    mentions: { direct: true, replies: true }, approvals: { requests: true, decisions: true, statusChanges: true },
    manager: { pendingApprovals: true, overdueReviews: true, goalRisks: true } };
}
export function hasManagerAlerts(role: UserRole) { return role === "department_manager" || role === "tech_lead" || role === "hr" || role === "admin"; }
function cleanNotificationDelivery(value: NotificationDelivery): NotificationDelivery {
  return { frequency: value.frequency, digestTime: value.digestTime, digestDay: value.digestDay,
    channels: Object.fromEntries(notificationCategories.map(({ key }) => [key, { email: value.channels[key].email, inApp: value.channels[key].inApp }])) as NotificationDelivery["channels"],
    reminders: { enabled: value.reminders.enabled, daysBefore: value.reminders.daysBefore, time: value.reminders.time, weekdaysOnly: value.reminders.weekdaysOnly, overdue: value.reminders.overdue },
    mentions: { direct: value.mentions.direct, replies: value.mentions.replies },
    approvals: { requests: value.approvals.requests, decisions: value.approvals.decisions, statusChanges: value.approvals.statusChanges },
    manager: { pendingApprovals: value.manager.pendingApprovals, overdueReviews: value.manager.overdueReviews, goalRisks: value.manager.goalRisks } };
}
export interface PersonalPreferences {
  language: "en";
  timezone: string;
  landingPage: string;
  theme: ThemeMode;
  appearance: AppearancePreferences;
  notifications: NotificationPreferences;
}
export const landingPages: Record<UserRole, { href: string; label: string }[]> = {
  admin: [{ href: "/admin/dashboard", label: "Dashboard" }, { href: "/admin/configuration", label: "Administration" }],
  hr: [{ href: "/hr/dashboard", label: "Dashboard" }, { href: "/hr/organization", label: "Organization" }, { href: "/hr/review-cycles", label: "Review cycles" }, { href: "/hr/performance-framework", label: "Performance framework" }, { href: "/hr/configuration", label: "Workspace configuration" }],
  department_manager: [{ href: "/manager/dashboard", label: "Dashboard" }],
  tech_lead: [{ href: "/tech-lead/dashboard", label: "Dashboard" }],
  employee: [{ href: "/employee/dashboard", label: "Dashboard" }, { href: "/employee/profile", label: "My profile" }, { href: "/employee/goals", label: "Goals" }, { href: "/employee/reviews", label: "My reviews" }, { href: "/employee/feedback", label: "Feedback" }, { href: "/employee/development", label: "Development" }],
};
export const roleNames: Record<UserRole, string> = { admin: "Admin", hr: "HR", department_manager: "Manager", tech_lead: "Team Lead", employee: "Employee" };
export const notificationOptions = [{ key: "email", title: "Optional email notifications" }, { key: "goals", title: "Goal and OKR updates" }, { key: "reviews", title: "Performance review reminders" }, { key: "feedback", title: "Feedback notifications" }, { key: "development", title: "Training and development reminders" }] as const;
export function defaultPreferences(role: UserRole): PersonalPreferences { return { language: "en", timezone: "UTC", landingPage: landingPages[role][0].href, theme: "system", appearance: defaultAppearance(), notifications: { email: true, goals: true, reviews: true, feedback: true, development: true, delivery: defaultNotificationDelivery() } }; }
export function preferenceKey(userId: string) { return `personal-preferences:v1:${encodeURIComponent(userId)}`; }
export function notificationDeliveryKey(userId: string) { return `personal-notification-delivery:v1:${encodeURIComponent(userId)}`; }
export function cleanPreferences(value: PersonalPreferences): PersonalPreferences {
  const appearance = value.appearance === undefined ? defaultAppearance() : value.appearance;
  return { language: value.language, timezone: value.timezone, landingPage: value.landingPage, theme: value.theme, appearance: { accent: appearance.accent, fontSize: appearance.fontSize, reduceMotion: appearance.reduceMotion, contrast: appearance.contrast }, notifications: { email: value.notifications.email, goals: value.notifications.goals, reviews: value.notifications.reviews, feedback: value.notifications.feedback, development: value.notifications.development, delivery: cleanNotificationDelivery(value.notifications.delivery === undefined ? defaultNotificationDelivery(value.notifications) : value.notifications.delivery) } };
}
export function validatePreferences(value: PersonalPreferences, role: UserRole): Record<string, string> {
  const errors: Record<string, string> = {};
  if (value.language !== "en") errors.language = "English is currently the only supported language.";
  if (!["light", "dark", "system"].includes(value.theme)) errors.theme = "Choose Light, Dark or System Default.";
  if (!value.appearance || !["blue", "teal", "violet"].includes(value.appearance.accent) || !["system", "on", "off"].includes(value.appearance.reduceMotion) || !["standard", "high"].includes(value.appearance.contrast)) errors.appearance = "Choose valid appearance options.";
  if (!Number.isInteger(value.appearance?.fontSize) || value.appearance.fontSize < 14 || value.appearance.fontSize > 18) errors.appearance = "UI font size must be a whole number from 14 to 18 px.";
  if (!landingPages[role].some(({ href }) => href === value.landingPage)) errors.landingPage = "Choose a page available to your role.";
  try { new Intl.DateTimeFormat("en", { timeZone: value.timezone }); if (!value.timezone) throw new Error(); } catch { errors.timezone = "Choose a valid time zone."; }
  if (notificationOptions.some(({ key }) => typeof value.notifications?.[key] !== "boolean")) errors.notifications = "Choose valid notification preferences.";
  const delivery = value.notifications?.delivery;
  const time = (value: unknown) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!delivery || !["instant", "daily", "weekly"].includes(delivery.frequency) || !time(delivery.digestTime) || !Number.isInteger(delivery.digestDay) || delivery.digestDay < 0 || delivery.digestDay > 6) errors.notifications = "Choose a valid notification frequency, digest time and day.";
  if (!delivery || notificationCategories.some(({ key }) => typeof delivery.channels?.[key]?.email !== "boolean" || typeof delivery.channels?.[key]?.inApp !== "boolean")) errors.notifications = "Choose valid channels for each notification category.";
  if (!delivery?.reminders || !Number.isInteger(delivery.reminders.daysBefore) || delivery.reminders.daysBefore < 1 || delivery.reminders.daysBefore > 30 || !time(delivery.reminders.time)) errors.notifications = "Set reminders 1–30 days before the deadline and choose a valid time.";
  const flags = [delivery?.reminders?.enabled, delivery?.reminders?.weekdaysOnly, delivery?.reminders?.overdue, delivery?.mentions?.direct, delivery?.mentions?.replies, delivery?.approvals?.requests, delivery?.approvals?.decisions, delivery?.approvals?.statusChanges, delivery?.manager?.pendingApprovals, delivery?.manager?.overdueReviews, delivery?.manager?.goalRisks];
  if (flags.some((flag) => typeof flag !== "boolean")) errors.notifications = "Choose valid notification options.";
  return errors;
}
export function parsePreferences(value: unknown, role: UserRole): PersonalPreferences | null {
  try {
    const result = cleanPreferences(value as PersonalPreferences);
    return Object.keys(validatePreferences(result, role)).length ? null : result;
  } catch { return null; }
}
export interface SelfProfile {
  id: string; email: string; role: UserRole; status?: string;
  details?: ProfileDetails;
  lastLoginAt?: string | null; passwordChangedAt?: string | null;
  capabilities?: { editableProfileFields: string[]; extendedProfile?: boolean; corrections?: boolean; correctionReview?: boolean; passwordChange: boolean; authMethod: "password" | "managed" | "sso"; mfa: boolean; sessions: boolean };
  employee: { _id: string; employeeNumber: string; firstName: string; lastName: string; workEmail: string; phone?: string; address?: string; jobTitle?: string; department?: string; team?: string; reportingManager?: string } | null;
}
export function validateContact(phone: string, address: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (phone.trim() && (!/^\+?[0-9\-\s()]{7,20}$/.test(phone.trim()) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15)) errors.phone = "Enter a phone number with 7–15 digits, or leave it empty.";
  if (address.trim().length > 300) errors.address = "Use at most 300 characters.";
  return errors;
}
export function validatePassword(current: string, next: string, confirm: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!current) errors.current = "Enter your current password.";
  if (next.length < 8) errors.next = "Use at least 8 characters.";
  else if (new TextEncoder().encode(next).length > 72) errors.next = "Use at most 72 UTF-8 bytes (some characters use multiple bytes).";
  else if (next === current) errors.next = "Choose a different password.";
  if (!confirm || confirm !== next) errors.confirm = "The new passwords must match.";
  return errors;
}
