import type { DirectoryPerson, NamedReference, PersonReference } from "@/types/organization-views";

export function referenceId(value: NamedReference | PersonReference | undefined): string {
  return typeof value === "string" ? value : value?._id ?? "";
}
export function directoryName(person: DirectoryPerson): string {
  return person.fullName || `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || person.employeeNumber || person.workEmail || "Unnamed employee";
}
export function personLabel(value: PersonReference | undefined): string {
  return !value ? "Unassigned" : typeof value === "string" ? "Employee unavailable" : directoryName(value);
}
export function referenceLabel(value: NamedReference | undefined): string {
  return value && typeof value !== "string" ? value.name : value ? "Record unavailable" : "Unassigned";
}
