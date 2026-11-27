import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Pagination } from "@/types/organization-views";
import type { GoalPlan, PlanInput, PlanStatus } from "@/types/goals-api";

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
