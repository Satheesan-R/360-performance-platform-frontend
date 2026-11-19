import type { KeyResult, Objective } from "@/types/goals";

// Decreasing targets use the same baseline-to-target distance as increasing ones.
export function keyResultProgress(result: KeyResult): number {
  const distance = result.target - result.baseline;
  if (!distance || !Number.isFinite(distance) || !Number.isFinite(result.current)) return 0;
  return Math.round(Math.min(100, Math.max(0, ((result.current - result.baseline) / distance) * 100)));
}
