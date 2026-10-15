export type CriteriaKind = "competencies" | "kpis";
export type CriteriaStatus = "active" | "inactive";
export interface CriterionBase {
  _id: string;
  name: string;
  description: string;
  weight: number;
  status: CriteriaStatus;
}
export interface Competency extends CriterionBase {
  category: "technical" | "behavioral";
}
export interface Kpi extends CriterionBase {
  measurementUnit: string;
  targetValue: number;
  targetPeriod?: string;
}
export type Criterion = Competency | Kpi;
export type CompetencyInput = Omit<Competency, "_id">;
export type KpiInput = Omit<Kpi, "_id">;
export interface CriteriaScoring {
  competencyCount: number;
  kpiCount: number;
  totalWeight: number;
  weightsValid: boolean;
}
export interface CriteriaList {
  items: Criterion[];
  scoring: CriteriaScoring;
}
