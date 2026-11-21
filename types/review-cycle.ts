export type ReviewerRole = "self" | "peer" | "tech_lead" | "manager";
export interface ReviewerAssignment {
  employeeId: string;
  reviewerEmployeeId: string;
  role: ReviewerRole;
}
export interface CycleInput {
  reviewerAssignments?: ReviewerAssignment[];
  name: string;
  templateId: string;
  departmentIds: string[];
  employeeIds: string[];
  startDate: string;
  endDate: string;
}
export interface ReviewCycle extends CycleInput {
  _id: string;
  __v: number;
  status: string;
}
export interface CycleList {
  cycles: ReviewCycle[];
  pagination: { page: number; totalPages: number; total: number };
}
