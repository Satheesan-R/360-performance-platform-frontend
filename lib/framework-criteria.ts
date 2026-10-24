import type {
  CompetencyInput,
  CriteriaKind,
  KpiInput,
} from "@/types/framework-criteria";

export interface CriterionDraft {
  name: string;
  description: string;
  weight: string;
  status: "active" | "inactive";
  category: "technical" | "behavioral";
  measurementUnit: string;
  targetValue: string;
  targetPeriod: string;
}

function number(value: string, field: string) {
  if (!value.trim() || !Number.isFinite(Number(value)))
    throw new Error(`${field} must be a number.`);
  return Number(value);
}

export function criterionInput(
  kind: "competencies",
  draft: CriterionDraft,
): CompetencyInput;
export function criterionInput(kind: "kpis", draft: CriterionDraft): KpiInput;
export function criterionInput(
  kind: CriteriaKind,
  draft: CriterionDraft,
): CompetencyInput | KpiInput {
  const name = draft.name.trim();
  const description = draft.description.trim();
  if (!name || name.length > 200)
    throw new Error("Enter a name of up to 200 characters.");
  if (description.length > 2000)
    throw new Error("Description must be no longer than 2000 characters.");
  const weight = number(draft.weight, "Weight");
  if (weight < 0 || weight > 100)
    throw new Error("Weight must be between 0 and 100%.");
  if (!["active", "inactive"].includes(draft.status))
    throw new Error("Choose an active or inactive status.");
  const base = { name, description, weight, status: draft.status };
  if (kind === "competencies") {
    if (!["technical", "behavioral"].includes(draft.category))
      throw new Error("Choose a competency category.");
    return { ...base, category: draft.category };
  }
  const measurementUnit = draft.measurementUnit.trim();
  const targetPeriod = draft.targetPeriod.trim();
  if (!measurementUnit || measurementUnit.length > 200)
    throw new Error("Enter a measurement unit of up to 200 characters.");
  if (targetPeriod.length > 200)
    throw new Error("Target period must be no longer than 200 characters.");
  return {
    ...base,
    measurementUnit,
    targetValue: number(draft.targetValue, "Target value"),
    targetPeriod,
  };
}
