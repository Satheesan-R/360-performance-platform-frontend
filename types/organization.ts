export type OrganizationStatus = "active" | "inactive";

export interface Organization {
  _id: string;
  name: string;
  code: string;
  logoUrl?: string;
  industry: string;
  description: string;
  contactEmail: string;
  country: string;
  timezone: string;
  status: OrganizationStatus;
}

export interface OrganizationSummary {
  totalEmployees: number;
  departments: number;
  teams: number;
  activeReviewFrameworks: number;
}

export interface StructureRecord {
  _id: string;
  name: string;
  code: string;
  description: string;
  status: OrganizationStatus;
  departmentHeadId?: string;
  departmentId?: string;
  teamLeadId?: string;
  employeeCount?: number;
  permissions?: string[];
}

export type StructureInput = Omit<StructureRecord, "_id" | "employeeCount">;
export type StructureKind = "departments" | "teams" | "employment-types" | "roles";

export interface HierarchyEmployee {
  _id: string;
  fullName: string;
  designation?: string;
  departmentName?: string;
  reportingManagerId: string | null;
}

export interface Permission {
  key: string;
  label: string;
  description?: string;
}
