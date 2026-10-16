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
