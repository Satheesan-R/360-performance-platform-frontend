import type { Organization } from "@/types/organization";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseOrganizationResponse(body: unknown): Organization {
  let value = body;
  if (isRecord(value) && "data" in value) value = value.data;
  if (isRecord(value) && "organization" in value) value = value.organization;

  if (!isRecord(value) || typeof value.name !== "string" || !value.name.trim()) {
    throw new Error("The organization response is missing a valid name. Expected an organization object, { organization: ... }, or { data: ... }.");
  }

  const text = (key: string) => typeof value[key] === "string" ? value[key] as string : "";
  if (value.status !== "active" && value.status !== "inactive") {
    throw new Error("The organization response contains an invalid status. Expected active or inactive.");
  }

  return {
    _id: text("_id"),
    name: value.name.trim(),
    code: text("code"),
    logoUrl: text("logoUrl"),
    industry: text("industry"),
    description: text("description"),
    contactEmail: text("contactEmail"),
    country: text("country"),
    timezone: text("timezone"),
    status: value.status,
  };
}
