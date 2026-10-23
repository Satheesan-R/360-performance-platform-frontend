import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { FrameworkEmploymentType, FrameworkInput, FrameworkList, FrameworkSummary, PerformanceFramework } from "@/types/performance-framework";

function config(signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}

export async function getFrameworks(params: { search: string; status: string; page: number }, signal?: AbortSignal) {
  const response = await api.get<FrameworkList>("/performance-frameworks", {
    ...config(signal), params: { ...params, status: params.status || undefined, limit: 20 },
  });
  return response.data;
}

export async function getFrameworkSummary(signal?: AbortSignal) {
  const response = await api.get<{ summary: FrameworkSummary }>("/performance-frameworks/summary", config(signal));
  return response.data.summary;
}

export async function getFrameworkEmploymentTypes(signal?: AbortSignal) {
  const types: FrameworkEmploymentType[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await api.get<{ employmentTypes: FrameworkEmploymentType[]; pagination: { totalPages: number } }>("/employment-types", {
      ...config(signal), params: { status: "active", page, limit: 100 },
    });
    types.push(...response.data.employmentTypes);
    totalPages = response.data.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return types;
}

export async function saveFramework(values: Partial<FrameworkInput>, id?: string) {
  const response = id
    ? await api.patch<{ framework: PerformanceFramework }>(`/performance-frameworks/${encodeURIComponent(id)}`, values, config())
    : await api.post<{ framework: PerformanceFramework }>("/performance-frameworks", values, config());
  return response.data.framework;
}
