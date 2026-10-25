import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  DepartmentList,
  DepartmentRecord,
  DepartmentSummary,
  DepartmentTree,
  DirectoryList,
  DirectoryPerson,
  StructureValues,
  TeamList,
  TeamRecord,
} from "@/types/organization-views";

export type ViewFilters = {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
};
function config(signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}
const id = encodeURIComponent;
function params(filters: ViewFilters) {
  return {
    ...filters,
    status: filters.status || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  };
}

export async function getDepartments(
  filters: ViewFilters,
  signal?: AbortSignal,
) {
  return (
    await api.get<DepartmentList>("/departments", {
      ...config(signal),
      params: params(filters),
    })
  ).data;
}
export async function getDepartment(idValue: string, signal?: AbortSignal) {
  return (
    await api.get<{ department: DepartmentRecord }>(
      `/departments/${id(idValue)}`,
      config(signal),
    )
  ).data.department;
}
export async function getDepartmentSummary(signal?: AbortSignal) {
  return (
    await api.get<{ summary: DepartmentSummary }>(
      "/departments/summary",
      config(signal),
    )
  ).data.summary;
}
export async function getTeams(
  filters: ViewFilters,
  departmentId?: string,
  signal?: AbortSignal,
) {
  const path = departmentId
    ? `/departments/${id(departmentId)}/teams`
    : "/teams";
  return (
    await api.get<TeamList>(path, {
      ...config(signal),
      params: params(filters),
    })
  ).data;
}
export async function getTeam(idValue: string, signal?: AbortSignal) {
  return (
    await api.get<{ team: TeamRecord }>(`/teams/${id(idValue)}`, config(signal))
  ).data.team;
}
export async function getDirectory(
  kind: "departments" | "teams",
  idValue: string,
  filters: ViewFilters,
  signal?: AbortSignal,
) {
  return (
    await api.get<DirectoryList>(`/${kind}/${id(idValue)}/employees`, {
      ...config(signal),
      params: params({
        search: filters.search,
        page: filters.page,
        limit: filters.limit,
      }),
    })
  ).data;
}
export async function getDepartmentTree(idValue: string, signal?: AbortSignal) {
  return (
    await api.get<DepartmentTree>(
      `/departments/${id(idValue)}/hierarchy`,
      config(signal),
    )
  ).data;
}
export async function saveOrganizationStructure(
  kind: "departments" | "teams",
  values: StructureValues,
  idValue?: string,
) {
  if (idValue) await api.patch(`/${kind}/${id(idValue)}`, values, config());
  else await api.post(`/${kind}`, values, config());
}
export async function deactivateDepartment(idValue: string) {
  await api.delete(`/departments/${id(idValue)}`, config());
}
export async function assignEmployeeTeam(
  employeeId: string,
  teamId: string | null,
) {
  await api.patch(`/employees/${id(employeeId)}/team`, { teamId }, config());
}
export async function assignEmployeeDepartment(
  employeeId: string,
  departmentId: string | null,
) {
  await api.patch(
    `/employees/${id(employeeId)}/department`,
    { departmentId },
    config(),
  );
}
export async function getDepartmentOptions(signal?: AbortSignal) {
  const records: DepartmentRecord[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await getDepartments({ page, limit: 100 }, signal);
    records.push(...result.departments);
    totalPages = result.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return records;
}
export async function getEmployeeOptions(signal?: AbortSignal) {
  const result = await api.get<
    DirectoryPerson[] | { employees: DirectoryPerson[] }
  >("/employees", config(signal));
  return Array.isArray(result.data) ? result.data : result.data.employees;
}
