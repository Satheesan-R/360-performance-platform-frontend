import type { FrameworkScoring, ReviewerRatings, ReviewerRole, ScoringConfiguration, ScoringPreview } from "@/types/framework-scoring";

export const reviewerRoles: ReviewerRole[] = ["self", "peer", "manager"];
export interface ScoringDraft {
  editScale: boolean;
  editCategories: boolean;
  editReviewers: boolean;
  max: "" | 3 | 4 | 5;
  labels: string[];
  categories: Record<"technical" | "behavioral", string>;
  reviewers: Record<ReviewerRole, string>;
  enabledReviewers: ReviewerRole[];
}

export function scoringDraft(settings: FrameworkScoring): ScoringDraft {
  return {
    editScale: settings.ratingScale !== null, editCategories: settings.categoryWeights !== null,
    editReviewers: settings.reviewerWeights !== null || settings.enabledReviewers.length > 0,
    max: settings.ratingScale?.max ?? "",
    labels: Array.from({ length: 5 }, (_, index) => settings.ratingScale?.levels.find((level) => level.value === index + 1)?.label ?? ""),
    categories: { technical: settings.categoryWeights ? String(settings.categoryWeights.technical) : "", behavioral: settings.categoryWeights ? String(settings.categoryWeights.behavioral) : "" },
    reviewers: { self: settings.reviewerWeights ? String(settings.reviewerWeights.self) : "", peer: settings.reviewerWeights ? String(settings.reviewerWeights.peer) : "", manager: settings.reviewerWeights ? String(settings.reviewerWeights.manager) : "" },
    enabledReviewers: [...settings.enabledReviewers],
  };
}

function weight(value: string) {
  const number = Number(value);
  if (!value.trim() || !Number.isFinite(number) || number < 0 || number > 100) throw new Error("Enter every weight as a number between 0 and 100%.");
  return number;
}
function total(values: number[], label: string) {
  if (Math.abs(values.reduce((sum, value) => sum + value, 0) - 100) >= 0.000001) throw new Error(`${label} must total 100%.`);
}

export function scoringInput(draft: ScoringDraft): Partial<ScoringConfiguration> {
  const configuration: Partial<ScoringConfiguration> = {};
  if (draft.editScale) {
    if (!draft.max || ![3, 4, 5].includes(draft.max)) throw new Error("Choose a 1–3, 1–4, or 1–5 rating scale.");
    const levels = Array.from({ length: draft.max }, (_, index) => {
      const label = draft.labels[index]?.trim();
      if (!label || label.length > 200) throw new Error("Enter a label of 1 to 200 characters for every rating level.");
      return { value: index + 1, label };
    });
    configuration.ratingScale = { min: 1, max: draft.max, levels };
  }
  if (draft.editCategories) {
    const categories = { technical: weight(draft.categories.technical), behavioral: weight(draft.categories.behavioral) };
    total(Object.values(categories), "Category weights");
    configuration.categoryWeights = categories;
  }
  if (draft.editReviewers) {
    if (!draft.enabledReviewers.length || new Set(draft.enabledReviewers).size !== draft.enabledReviewers.length || draft.enabledReviewers.some((role) => !reviewerRoles.includes(role))) throw new Error("Enable at least one reviewer type.");
    const reviewers = { self: weight(draft.reviewers.self), peer: weight(draft.reviewers.peer), manager: weight(draft.reviewers.manager) };
    total(Object.values(reviewers), "Reviewer weights");
    for (const role of reviewerRoles) {
      if (draft.enabledReviewers.includes(role) ? reviewers[role] <= 0 : reviewers[role] !== 0) throw new Error("Enabled reviewers need positive weights; disabled reviewers need 0%.");
    }
    configuration.reviewerWeights = reviewers;
    configuration.enabledReviewers = [...draft.enabledReviewers];
  }
  if (!Object.keys(configuration).length) throw new Error("Select at least one section to save or preview changes.");
  return configuration;
}

export function sampleRatings(preview: ScoringPreview, values: Partial<Record<ReviewerRole, Record<string, string>>>): ReviewerRatings {
  const ratings: ReviewerRatings = {};
  for (const role of preview.enabledReviewers) {
    ratings[role] = {};
    for (const criterion of preview.criteria.filter((item) => item.effectiveWeight > 0)) {
      const value = values[role]?.[criterion.criterionId] ?? "";
      const rating = Number(value);
      if (!value.trim() || !Number.isInteger(rating) || rating < preview.ratingScale.min || rating > preview.ratingScale.max) throw new Error(`Choose a rating for ${role}: ${criterion.name}.`);
      ratings[role]![criterion.criterionId] = rating;
    }
  }
  return ratings;
}
