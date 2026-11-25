import type { Employee } from "@/types/employee";
import type { ReviewerAssignment, ReviewerRole } from "@/types/review-cycle";

export const reviewerRoleLabels: Record<ReviewerRole, string> = {
  self: "Self", peer: "Peer", tech_lead: "Tech Lead", manager: "Reporting Manager",
};

export function reviewerDepartmentId(employee: Employee) {
  return typeof employee.departmentId === "string" ? employee.departmentId : employee.departmentId?._id;
}

export function eligibleReviewers(participant: Employee | undefined, role: ReviewerRole, employees: Employee[]) {
  if (!participant) return [];
  const managerId = typeof participant.managerId === "string" ? participant.managerId : participant.managerId?._id;
  const candidates = employees.filter(employee => {
    if (employee.user?.status !== "active") return false;
    if (role === "self") return employee._id === participant._id;
    if (employee._id === participant._id) return false;
    if (role === "manager") return employee._id === managerId;
    if (role === "peer") return employee.user.role === "employee";
    return employee.user.role === "tech_lead";
  });
  const departmentId = reviewerDepartmentId(participant);
  if (!departmentId) return candidates;
  return candidates.sort((a, b) =>
    Number(reviewerDepartmentId(b) === departmentId) - Number(reviewerDepartmentId(a) === departmentId));
}
export function assignmentConflict(assignments: ReviewerAssignment[], next: ReviewerAssignment) {
  return assignments.some(item => item.employeeId === next.employeeId &&
    (item.reviewerEmployeeId === next.reviewerEmployeeId || (next.role !== "peer" && item.role === next.role)));
}

export function participantsWithoutReviewers(participantIds: string[], assignments: ReviewerAssignment[] = []) {
  const covered = new Set(assignments.map(assignment => assignment.employeeId));
  return participantIds.filter(id => !covered.has(id));
}
