import type { KeyResult, Objective } from "@/types/goals";

// Decreasing targets use the same baseline-to-target distance as increasing ones.
export function keyResultProgress(result: KeyResult): number {
  const distance = result.target - result.baseline;
  if (!distance || !Number.isFinite(distance) || !Number.isFinite(result.current)) return 0;
  return Math.round(Math.min(100, Math.max(0, ((result.current - result.baseline) / distance) * 100)));
}

export function objectiveProgress(objective: Objective): number {
  if (!objective.keyResults.length) return 0;
  return Math.round(objective.keyResults.reduce((total, result) => total + keyResultProgress(result), 0) / objective.keyResults.length);
}

export function validateObjective(objective: Objective): string | null {
  if (!objective.title.trim()) return "Enter an objective title.";
  if (!objective.owner.trim()) return "Enter the objective owner's name.";
  if (!objective.startDate || !objective.endDate || !validDate(objective.startDate) || !validDate(objective.endDate)) return "Choose valid start and end dates.";
  if (objective.endDate < objective.startDate) return "The end date must be on or after the start date.";
  if (!objective.keyResults.length) return "Add at least one measurable key result.";
  for (const result of objective.keyResults) {
    if (!result.title.trim() || !result.unit.trim()) return "Each key result needs a title and unit.";
    if (![result.baseline, result.target, result.current].every(Number.isFinite)) return "Key result values must be finite numbers.";
    if (result.baseline === result.target) return "A key result target must differ from its baseline.";
  }
  if (objective.status === "completed" && objective.keyResults.some(result => result.target > result.baseline ? result.current < result.target : result.current > result.target)) return "All key results must reach their targets before completing this objective.";
  return null;
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function isObjective(value: unknown): value is Objective {
  if (!value || typeof value !== "object") return false;
  const item = value as Objective;
  return typeof item.id === "string" && typeof item.title === "string" && typeof item.description === "string"
    && typeof item.owner === "string" && typeof item.startDate === "string" && typeof item.endDate === "string"
    && typeof item.updatedAt === "string" && ["organization", "team", "individual"].includes(item.scope)
    && ["draft", "active", "completed", "archived"].includes(item.status) && Array.isArray(item.keyResults)
    && item.keyResults.every(result => result && typeof result.id === "string" && typeof result.title === "string"
      && typeof result.unit === "string" && [result.baseline, result.target, result.current].every(value => typeof value === "number" && Number.isFinite(value)))
    && validateObjective(item) === null;
}
