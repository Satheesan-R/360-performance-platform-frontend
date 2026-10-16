import type { UserRole } from "@/types/auth";

export type SettingsRole = Extract<UserRole, "hr" | "admin">;

export type SettingsSection = "general" | "roles" | "reviews" | "notifications" | "performance";

export type ReviewerStage = "self" | "peer" | "manager";

export type EmploymentType = "intern" | "probationary" | "permanent";

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
