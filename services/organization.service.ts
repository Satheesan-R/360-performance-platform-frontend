import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { HierarchyEmployee, Organization, OrganizationSummary, Permission, StructureInput, StructureKind, StructureRecord } from "@/types/organization";

// Paths are relative to NEXT_PUBLIC_API_URL. Keep backend contract changes here.
export const organizationEndpoints = {
  organization: "/organization",
  summary: "/organization/summary",
  departments: "/departments",
  teams: "/teams",
  "employment-types": "/employment-types",
  roles: "/roles",
  permissions: "/permissions",
  hierarchy: "/organization/hierarchy",
  reportingManager: (id: string) => `/employees/${encodeURIComponent(id)}/reporting-manager`,
};

function config(signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}

function unwrap<T>(body: T | { data: T }): T {
  return typeof body === "object" && body !== null && "data" in body ? body.data : body as T;
}

function list<T>(body: unknown, key: string): T[] {
  const value = unwrap(body);
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "object" && value !== null && key in value) {
    const entries = (value as Record<string, unknown>)[key];
    if (Array.isArray(entries)) return entries as T[];
  }
  throw new Error(`Unexpected ${key} response. Check the Organization API contract.`);
}

export async function getOrganization(signal?: AbortSignal) {
  const response = await api.get<Organization | { data: Organization }>(organizationEndpoints.organization, config(signal));
  return unwrap(response.data);
}

export async function getOrganizationSummary(signal?: AbortSignal) {
  const response = await api.get<OrganizationSummary | { data: OrganizationSummary }>(organizationEndpoints.summary, config(signal));
  return unwrap(response.data);
}

export async function updateOrganization(values: Omit<Organization, "_id">) {
  await api.patch(organizationEndpoints.organization, values, config());
}

export async function getStructure(kind: StructureKind, signal?: AbortSignal) {
  const response = await api.get(organizationEndpoints[kind], config(signal));
  return list<StructureRecord>(response.data, kind === "employment-types" ? "employmentTypes" : kind);
}

export async function saveStructure(kind: StructureKind, values: StructureInput, id?: string) {
  const path = organizationEndpoints[kind];
  if (id) await api.patch(`${path}/${encodeURIComponent(id)}`, values, config());
  else await api.post(path, values, config());
}

export async function getHierarchy(signal?: AbortSignal) {
  const response = await api.get(organizationEndpoints.hierarchy, config(signal));
  return list<HierarchyEmployee>(response.data, "employees");
}

export async function updateReportingManager(id: string, reportingManagerId: string | null) {
  await api.patch(organizationEndpoints.reportingManager(id), { reportingManagerId }, config());
}

export async function getPermissions(signal?: AbortSignal) {
  const response = await api.get(organizationEndpoints.permissions, config(signal));
  return list<Permission>(response.data, "permissions");
}
