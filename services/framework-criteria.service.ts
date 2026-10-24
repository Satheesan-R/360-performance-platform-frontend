import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getFrameworks } from "./performance-framework.service";
import type { PerformanceFramework } from "@/types/performance-framework";
import type {
  Competency,
  CompetencyInput,
  CriteriaKind,
  CriteriaList,
  CriteriaScoring,
  CriteriaStatus,
  Kpi,
  KpiInput,
} from "@/types/framework-criteria";

function config(signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}

function path(frameworkId: string, kind?: CriteriaKind, id?: string) {
  return `/performance-frameworks/${encodeURIComponent(frameworkId)}${kind ? `/${kind}` : ""}${id ? `/${encodeURIComponent(id)}` : ""}`;
}

export async function getCriteriaFrameworks(signal?: AbortSignal) {
  const frameworks: PerformanceFramework[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await getFrameworks({ search: "", status: "", page }, signal);
    frameworks.push(...data.frameworks);
    totalPages = data.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return frameworks;
}

export async function getCriteriaFramework(id: string, signal?: AbortSignal) {
  const response = await api.get<{ framework: PerformanceFramework }>(
    path(id),
    config(signal),
  );
  return response.data.framework;
}

export async function getCriteria(
  frameworkId: string,
  kind: CriteriaKind,
  filters: { search: string; status: string },
  signal?: AbortSignal,
): Promise<CriteriaList> {
  const response = await api.get<{
    competencies?: Competency[];
    kpis?: Kpi[];
    scoring: CriteriaScoring;
  }>(path(frameworkId, kind), {
    ...config(signal),
    params: { search: filters.search, status: filters.status || undefined },
  });
  const items = response.data[kind];
  if (!Array.isArray(items) || !response.data.scoring)
    throw new Error(
      "Unexpected criteria response. Reload the page or check the server.",
    );
  return { items, scoring: response.data.scoring };
}

export async function saveCriterion(
  frameworkId: string,
  kind: "competencies",
  values: Partial<CompetencyInput>,
  id?: string,
): Promise<void>;
export async function saveCriterion(
  frameworkId: string,
  kind: "kpis",
  values: Partial<KpiInput>,
  id?: string,
): Promise<void>;
export async function saveCriterion(
  frameworkId: string,
  kind: CriteriaKind,
  values: Partial<CompetencyInput> | Partial<KpiInput>,
  id?: string,
) {
  if (id) await api.patch(path(frameworkId, kind, id), values, config());
  else await api.post(path(frameworkId, kind), values, config());
}

export async function setCriterionStatus(
  frameworkId: string,
  kind: CriteriaKind,
  id: string,
  status: CriteriaStatus,
) {
  await api.patch(path(frameworkId, kind, id), { status }, config());
}
