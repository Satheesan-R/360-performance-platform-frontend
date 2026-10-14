export type FrameworkStatus = "draft" | "active" | "archived";

export interface FrameworkEmploymentType {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface PerformanceFramework {
  _id: string;
  name: string;
  description: string;
  applicableEmploymentTypeIds: FrameworkEmploymentType[];
  applicableJobRoles: string[];
  status: FrameworkStatus;
  competencyCount: number;
  kpiCount: number;
  ratingScale: { name: string } | null;
}

export interface FrameworkInput {
  name: string;
  description: string;
  applicableEmploymentTypeIds: string[];
  applicableJobRoles: string[];
  status: FrameworkStatus;
}

export interface FrameworkList {
  frameworks: PerformanceFramework[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface FrameworkSummary {
  total: number;
  draft: number;
  active: number;
  archived: number;
}
