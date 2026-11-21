import type { OrganizationStatus } from "./organization";

export interface DirectoryPerson {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  employeeNumber?: string;
  workEmail?: string;
  jobTitle?: string;
  onboardingStatus?: string;
  departmentId?: NamedReference;
  teamId?: NamedReference;
  managerId?: string | DirectoryPerson | null;
  user?: { role?: string; status?: string } | null;
  unassignedReason?: "no-team" | "team-not-in-department";
}
export type NamedReference =
  | string
  | { _id: string; name: string; status?: OrganizationStatus }
  | null;
export type PersonReference = string | DirectoryPerson | null;
export interface DepartmentRecord {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: OrganizationStatus;
  headEmployeeId: PersonReference;
  employeeCount: number;
  teamCount: number;
}
export interface TeamRecord {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: OrganizationStatus;
  departmentId: NamedReference;
  teamLeadEmployeeId: PersonReference;
  employeeCount: number;
}
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface DepartmentList {
  departments: DepartmentRecord[];
  pagination: Pagination;
}
export interface TeamList {
  teams: TeamRecord[];
  pagination: Pagination;
}
export interface DirectoryList {
  employees: DirectoryPerson[];
  pagination: Pagination;
}
export interface DepartmentSummary {
  total: number;
  active: number;
  inactive: number;
}
export interface DepartmentTree {
  department: DepartmentRecord;
  teams: (TeamRecord & { employees: DirectoryPerson[] })[];
  unassignedEmployees: DirectoryPerson[];
  summary: {
    teamCount: number;
    employeeCount: number;
    unassignedEmployeeCount: number;
  };
}
export interface StructureValues {
  name: string;
  code: string;
  description: string;
  status: OrganizationStatus;
  headEmployeeId?: string | null;
  departmentId?: string;
  teamLeadEmployeeId?: string | null;
}
