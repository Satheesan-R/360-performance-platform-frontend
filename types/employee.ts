import type { UserRole } from "./auth";

export type EmploymentType = "full-time" | "probation" | "intern";

export interface CreateEmployeeRequest {
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  personalEmail?: string;
  phone?: string;
  department?: string;
  designation?: string;
  reportingManager?: string;
  officeLocation?: string;
  companyEmail: string;
  employmentType?: EmploymentType;
  contractStartDate?: string;
  role?: UserRole;
}

export interface CreateEmployeeResponse {
  message: string;
  employee: {
    _id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    onboardingStatus: "pending" | "completed";
  };
  activationUrl?: string;
}

export type Employee = CreateEmployeeResponse["employee"] & Partial<CreateEmployeeRequest>;
