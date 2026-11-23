import type { HierarchyEmployee } from "@/types/organization";

type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue
    : null;
}
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function referenceId(value: unknown): string {
  return text(value) || text(object(value)?._id);
}
function personName(value: RecordValue | null): string {
  return value ? text(value.fullName) || [text(value.firstName), text(value.lastName)].filter(Boolean).join(" ") : "";
}

export function parseHierarchyEmployees(records: unknown[]): HierarchyEmployee[] {
  return records.map((value) => {
    const record = object(value);
    const id = text(record?._id);
    if (!record || !id) throw new Error("Reporting hierarchy contains an invalid employee record.");
    const manager = "managerId" in record ? record.managerId : record.reportingManagerId;

    return {
      _id: id,
      fullName: personName(record) || text(record.employeeNumber) || "Unnamed employee",
      employeeNumber: text(record.employeeNumber),
      designation: text(record.jobTitle) || text(record.designation),
      departmentId: referenceId(record.departmentId),
      departmentName: text(object(record.departmentId)?.name) || text(record.departmentName),
      teamId: referenceId(record.teamId),
      teamName: text(object(record.teamId)?.name) || text(record.teamName),
      reportingManagerId: referenceId(manager) || null,
      reportingManagerName: personName(object(manager)) || text(record.reportingManagerName),
    };
  });
}
