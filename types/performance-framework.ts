import type { Competency, Kpi } from "./framework-criteria";
import type { RatingScale } from "./framework-scoring";

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
  competencies: Competency[];
  kpis: Kpi[];
  totalWeight: number;
  weightsValid: boolean;
  ratingScale: RatingScale | null;
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
