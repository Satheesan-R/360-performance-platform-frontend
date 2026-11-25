import type { Competency, Kpi } from "./framework-criteria";
import type { RatingScale, ScoringPreview } from "./framework-scoring";
import type {
  FrameworkEmploymentType,
  FrameworkStatus,
} from "./performance-framework";

export interface TemplateQuestion {
  _id?: string;
  prompt: string;
  required: boolean;
}
export interface TemplateSection {
  _id?: string;
  title: string;
  competencyIds: string[];
  kpiIds: string[];
  questions: TemplateQuestion[];
  required: boolean;
  allowComments: boolean;
  commentsRequired: boolean;
  evidenceRequired: boolean;
}
export type ReviewType = "annual" | "probation" | "internship";
export type TemplateTargetRole = "employee" | "tech_lead" | "department_manager";
export type TemplateApprovalStatus = "not_submitted" | "pending" | "approved" | "rejected";
export interface TemplateDepartment { _id: string; name: string; code?: string; status?: string }
export interface TemplateInput {
  reviewType?: ReviewType | null;
  departmentIds?: string[];
  targetRole?: TemplateTargetRole | null;
  name: string;
  description: string;
  frameworkId: string;
  employmentTypeIds: string[];
  evidenceRequired: boolean;
  sections: TemplateSection[];
  status: FrameworkStatus;
}
export interface TemplateFramework {
  applicableJobRoles?: string[];
  enabledReviewers?: import("./review-cycle").ReviewerRole[];
  name: string;
  status?: FrameworkStatus;
  competencies: Competency[];
  kpis: Kpi[];
  applicableEmploymentTypeIds: (string | FrameworkEmploymentType)[];
  ratingScale: RatingScale | null;
}
export interface ReviewTemplate extends TemplateInput {
  approvalStatus?: TemplateApprovalStatus;
  approvalComment?: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  _id: string;
  __v?: number;
  frameworkVersion: number | null;
  frameworkSnapshot: TemplateFramework | null;
}
export interface TemplateListItem extends Omit<
  ReviewTemplate,
  "frameworkId" | "employmentTypeIds" | "frameworkSnapshot" | "departmentIds"
> {
  frameworkId: { _id: string; name: string; status: FrameworkStatus } | null;
  employmentTypeIds: FrameworkEmploymentType[];
  departmentIds?: TemplateDepartment[];
}
export interface TemplateList {
  templates: TemplateListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export type MissingCriterion = { _id: string; missing: true };
export interface ResolvedTemplateSection extends TemplateSection {
  competencies: (Competency | MissingCriterion)[];
  kpis: (Kpi | MissingCriterion)[];
}
export interface TemplatePreview {
  approvalStatus?: TemplateApprovalStatus;
  reviewType?: ReviewType | null;
  departmentIds?: string[];
  targetRole?: TemplateTargetRole | null;
  templateId: string;
  name: string;
  description: string;
  status: FrameworkStatus;
  frameworkId: string;
  frameworkName: string;
  frameworkVersion: number;
  usesFrozenFramework: boolean;
  employmentTypeIds: string[];
  effectiveEmploymentTypeIds: string[];
  ratingScale: RatingScale | null;
  validation: { ready: boolean; message: string | null };
  criteriaWeights: ScoringPreview["criteria"];
  sections: ResolvedTemplateSection[];
}
export interface TemplateSnapshot {
  _id: string;
  templateId: string;
  sourceVersion: number;
  createdAt: string;
  configuration: Omit<TemplateInput, "status"> & {
    frameworkVersion: number;
    framework: TemplateFramework;
  };
}

