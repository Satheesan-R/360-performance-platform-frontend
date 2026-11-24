import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { AssignedReview, AssignedReviewList, CycleInput, CycleList, ReviewCycle, ReviewCycleResults, ReviewResponse, ReviewSectionResponse } from "@/types/review-cycle";
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

export async function publishReviewCycle(cycle: ReviewCycle) {
  return (await api.post<{ cycle: ReviewCycle }>(`/review-cycles/${encodeURIComponent(cycle._id)}/publish`, { version: cycle.__v ?? 0 }, config())).data.cycle;
}

export async function getAssignedReviewCycles(page: number, signal?: AbortSignal) {
  return (await api.get<AssignedReviewList>("/review-cycles/assigned", { ...config(signal), params: { page, limit: 20 } })).data;
}

export async function getAssignedReview(id: string, signal?: AbortSignal) {
  return (await api.get<{ review: AssignedReview }>(`/review-cycles/assigned/${encodeURIComponent(id)}`, config(signal))).data.review;
}

function responsePath(cycleId: string, participantId: string) {
  return `/review-cycles/assigned/${encodeURIComponent(cycleId)}/participants/${encodeURIComponent(participantId)}/response`;
}

export async function getAssignedReviewResponse(cycleId: string, participantId: string, signal?: AbortSignal) {
  return (await api.get<{ response: ReviewResponse }>(responsePath(cycleId, participantId), config(signal))).data.response;
}

export async function saveAssignedReviewResponse(
  cycleId: string,
  participantId: string,
  values: { version: number | null; submit: boolean; sections: ReviewSectionResponse[] },
) {
  return (await api.put<{ response: ReviewResponse }>(responsePath(cycleId, participantId), values, config())).data.response;
}

export async function getReviewCycleResults(id: string, signal?: AbortSignal) {
  return (await api.get<{ results: ReviewCycleResults }>(`/review-cycles/${encodeURIComponent(id)}/results`, config(signal))).data.results;
}
