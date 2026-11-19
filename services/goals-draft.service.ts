import { getCurrentUser } from "@/lib/auth";
import { isObjective } from "@/lib/goals";
import type { Objective } from "@/types/goals";

function storageKey() {
  const user = getCurrentUser();
  if (!user?.id) throw new Error("Please sign in again to access your drafts.");
  return `performance-goals-drafts:v1:${user.id}`;
}

export function readGoalDrafts(): Objective[] {
  const stored = localStorage.getItem(storageKey());
  if (!stored) return [];
  const data: unknown = JSON.parse(stored);
  if (!Array.isArray(data) || !data.every(isObjective)) {
    throw new Error("Saved goal drafts could not be read. Existing browser data has been preserved.");
  }
  return data;
}

export function writeGoalDrafts(objectives: Objective[]) {
  localStorage.setItem(storageKey(), JSON.stringify(objectives));
}
