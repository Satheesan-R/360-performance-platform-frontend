export type ReviewerRole = "self" | "peer" | "manager";
export interface RatingScale {
  min: 1;
  max: 3 | 4 | 5;
  levels: { value: number; label: string }[];
}
export type CategoryWeights = Record<"technical" | "behavioral", number>;
export type ReviewerWeights = Record<ReviewerRole, number>;
export interface ScoringConfiguration {
  ratingScale: RatingScale;
  categoryWeights: CategoryWeights;
  reviewerWeights: ReviewerWeights;
  enabledReviewers: ReviewerRole[];
}
export interface FrameworkScoring {
  frameworkId: string;
  version: number;
  ratingScale: RatingScale | null;
  categoryWeights: CategoryWeights | null;
  reviewerWeights: ReviewerWeights | null;
  enabledReviewers: ReviewerRole[];
  validation: { ready: boolean; message: string | null };
}
export type ReviewerRatings = Partial<
  Record<ReviewerRole, Record<string, number>>
>;
export interface ScoringPreview {
  frameworkId: string;
  version: number;
  criteria: {
    criterionId: string;
    type: "competency" | "kpi";
    name: string;
    category?: string;
    weight: number;
    effectiveWeight: number;
  }[];
  totalEffectiveWeight: number;
  ratingScale: RatingScale;
  reviewerWeights: ReviewerWeights;
  enabledReviewers: ReviewerRole[];
  sample: {
    score: number;
    normalizedPercent: number;
    reviewerScores: Partial<Record<ReviewerRole, number>>;
  } | null;
}
