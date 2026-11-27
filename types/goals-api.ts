import type { Pagination } from "./organization-views";

export type PlanStatus = "draft" | "active" | "closed" | "archived";
export type GoalStatus = "draft" | "active" | "completed" | "cancelled";
export type GoalLevel = "organization" | "team" | "individual";
export interface GoalPlan {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
}
export interface GoalKeyResult {
  _id: string;
  title: string;
  unit: string;
  type: "increase" | "decrease" | "milestone";
  startValue: number;
  targetValue: number;
  currentValue: number;
  checkInCount: number;
  progress: number;
}
export interface Goal {
  _id: string;
  planId: string;
  title: string;
  description: string;
  level: GoalLevel;
  ownerEmployeeId: string;
  teamId: string | null;
  parentGoalId: string | null;
  status: GoalStatus;
  keyResults: GoalKeyResult[];
  progress: number;
  isOverdue: boolean;
}
export interface GoalCheckIn {
  _id: string;
  previousValue: number;
  value: number;
  note: string;
  sequence: number;
  createdAt: string;
}
export interface GoalInput {
  planId: string;
  title: string;
  description: string;
  level: GoalLevel;
  ownerEmployeeId: string;
  teamId?: string;
  parentGoalId?: string;
}
export type PlanInput = Pick<GoalPlan, "name" | "description" | "startDate" | "endDate">;
export type KeyResultInput = Pick<GoalKeyResult, "title" | "type" | "unit" | "startValue" | "targetValue">;
export interface GoalFilters {
  page: number;
  planId?: string;
  level?: GoalLevel;
  status?: GoalStatus;
}
export interface GoalList { goals: Goal[]; pagination: Pagination }
