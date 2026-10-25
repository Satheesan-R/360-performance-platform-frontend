import type { UserRole } from "./auth";

export type EmploymentType = "full-time" | "probation" | "intern";

export interface CreateEmployeeRequest {
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  personalEmail?: string;
  phone?: string;
  department?: string;
  departmentId?: string;
  designation?: string;
  reportingManager?: string;
  managerId?: string;
  officeLocation?: string;
  companyEmail: string;
  employmentType?: EmploymentType;
  contractStartDate?: string;
  role?: UserRole;
}

export interface ActivationEmailDelivery {
  status: "accepted" | "failed";
  recipient: string;
  message?: string;
}

export interface CreateEmployeeResponse {
  message: string;
  emailDelivery?: ActivationEmailDelivery;
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

export type Employee = CreateEmployeeResponse["employee"] &
  Omit<Partial<CreateEmployeeRequest>, "departmentId"> & {
    departmentId?: string | { _id: string; name: string } | null;
    jobTitle?: string;
    user?: { role: UserRole; status: string } | null;
  };
