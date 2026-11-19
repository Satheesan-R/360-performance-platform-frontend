export type GoalScope = "organization" | "team" | "individual";
export type GoalStatus = "draft" | "active" | "completed" | "archived";

export interface KeyResult {
  id: string;
  title: string;
  unit: string;
  baseline: number;
  target: number;
  current: number;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  scope: GoalScope;
  owner: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  keyResults: KeyResult[];
  updatedAt: string;
}
