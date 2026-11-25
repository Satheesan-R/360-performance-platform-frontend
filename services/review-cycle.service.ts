import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { CycleInput, CycleList, ReviewCycle } from "@/types/review-cycle";
function config(signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}
export async function getReviewCycles(page: number, signal?: AbortSignal) {
  return (await api.get<CycleList>("/review-cycles", { ...config(signal), params: { page, limit: 20 } })).data;
}
export async function getReviewCycle(id: string) {
  return (await api.get<{ cycle: ReviewCycle }>(`/review-cycles/${encodeURIComponent(id)}`, config())).data.cycle;
}
export async function saveReviewCycle(values: CycleInput, cycle?: ReviewCycle) {
  const response = cycle
    ? await api.patch<{ cycle: ReviewCycle }>(`/review-cycles/${encodeURIComponent(cycle._id)}`, { ...values, version: cycle.__v }, config())
    : await api.post<{ cycle: ReviewCycle }>("/review-cycles", values, config());
  return response.data.cycle;
}
