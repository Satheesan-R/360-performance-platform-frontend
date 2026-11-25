import type { RatingScale } from "./framework-scoring";
import type { ResolvedTemplateSection } from "./review-template";

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
export interface AssignedReviewList {
  cycles: Pick<ReviewCycle, "_id" | "name" | "startDate" | "endDate">[];
  pagination: CycleList["pagination"];
}

export interface AssignedReview {
  name: string;
  templateName: string;
  description: string;
  ratingScale: RatingScale | null;
  sections: ResolvedTemplateSection[];
  assignments: { employeeId: string; participantName: string; role: ReviewerRole }[];
}

export interface ReviewSectionResponse {
  sectionId: string;
  ratings: Record<string, number>;
  kpiResults: Record<string, number>;
  answers: Record<string, string>;
  comment: string;
  evidenceUrl: string;
}

export interface ReviewResponse {
  version: number | null;
  submittedAt: string | null;
  sections: Array<Pick<ReviewSectionResponse, "sectionId"> & Partial<ReviewSectionResponse>>;
}

export interface ReviewCycleResults {
  name: string;
  maxRating: number;
  participants: { employeeId: string; name: string; submitted: number; assigned: number; score: number | null; normalizedPercent: number | null }[];
}
