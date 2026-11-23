import type { Employee } from "@/types/employee";
import type { ReviewerAssignment, ReviewerRole } from "@/types/review-cycle";

export const reviewerRoleLabels: Record<ReviewerRole, string> = {
  self: "Self", peer: "Peer", tech_lead: "Team Lead", manager: "Manager",
};
export function eligibleReviewers(participant: Employee | undefined, role: ReviewerRole, employees: Employee[]) {
  if (!participant) return [];
  const managerId = typeof participant.managerId === "string" ? participant.managerId : participant.managerId?._id;
  return employees.filter(employee => {
    if (employee.user?.status !== "active") return false;
    if (role === "self") return employee._id === participant._id;
    if (employee._id === participant._id) return false;
    if (role === "manager") return employee._id === managerId;
    if (role === "peer") return employee.user.role === participant.user?.role;
    return employee.user.role === "tech_lead";
  });
}
export function assignmentConflict(assignments: ReviewerAssignment[], next: ReviewerAssignment) {
  return assignments.some(item => item.employeeId === next.employeeId &&
    (item.reviewerEmployeeId === next.reviewerEmployeeId || (next.role !== "peer" && item.role === next.role)));
}
