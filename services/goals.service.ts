import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Pagination } from "@/types/organization-views";
import type { Goal, GoalCheckIn, GoalFilters, GoalInput, GoalKeyResult, GoalList, GoalPlan, KeyResultInput, PlanInput, PlanStatus } from "@/types/goals-api";

function config(signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}
const id = encodeURIComponent;

export async function getGoalPlans(signal?: AbortSignal) {
  const plans: GoalPlan[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { data } = await api.get<{ plans: GoalPlan[]; pagination: Pagination }>("/goal-plans", { ...config(signal), params: { page, limit: 100 } });
    plans.push(...data.plans);
    totalPages = data.pagination.totalPages;
    page++;
  } while (page <= totalPages);
  return plans;
}
export async function createGoalPlan(values: PlanInput) {
  return (await api.post<{ plan: GoalPlan }>("/goal-plans", values, config())).data.plan;
}
export async function updateGoalPlan(planId: string, values: Partial<PlanInput> & { status?: PlanStatus }) {
  return (await api.patch<{ plan: GoalPlan }>(`/goal-plans/${id(planId)}`, values, config())).data.plan;
}
export async function getGoals(filters: GoalFilters, signal?: AbortSignal) {
  return (await api.get<GoalList>("/goals", { ...config(signal), params: { ...filters, limit: 20 } })).data;
}
export async function createGoal(values: GoalInput) {
  return (await api.post<{ goal: Goal }>("/goals", values, config())).data.goal;
}
export async function updateGoal(goalId: string, values: Partial<Pick<Goal, "title" | "description" | "status">>) {
  return (await api.patch<{ goal: Goal }>(`/goals/${id(goalId)}`, values, config())).data.goal;
}
export async function addGoalKeyResult(goalId: string, values: KeyResultInput) {
  return (await api.post<{ keyResult: GoalKeyResult }>(`/goals/${id(goalId)}/key-results`, values, config())).data.keyResult;
}
export async function updateGoalKeyResult(keyId: string, values: Partial<KeyResultInput>) {
  return (await api.patch<{ keyResult: GoalKeyResult }>(`/key-results/${id(keyId)}`, values, config())).data.keyResult;
}
export async function recordGoalCheckIn(keyId: string, values: { value: number; note: string }) {
  return (await api.post<{ keyResult: GoalKeyResult; checkIn: GoalCheckIn; goalProgress: number }>(`/key-results/${id(keyId)}/check-ins`, values, config())).data;
}
export async function getGoalCheckIns(keyId: string, page: number, signal?: AbortSignal) {
  return (await api.get<{ checkIns: GoalCheckIn[]; pagination: Pagination }>(`/key-results/${id(keyId)}/check-ins`, { ...config(signal), params: { page, limit: 20 } })).data;
}
