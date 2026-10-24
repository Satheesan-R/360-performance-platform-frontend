import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  FrameworkScoring,
  ReviewerRatings,
  ScoringConfiguration,
  ScoringPreview,
} from "@/types/framework-scoring";

function config(signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}
function path(id: string) {
  return `/performance-frameworks/${encodeURIComponent(id)}/scoring`;
}

export async function getFrameworkScoring(id: string, signal?: AbortSignal) {
  const response = await api.get<{ scoring: FrameworkScoring }>(
    path(id),
    config(signal),
  );
  return response.data.scoring;
}

export async function saveFrameworkScoring(
  id: string,
  configuration: Partial<ScoringConfiguration>,
) {
  const response = await api.patch<{ scoring: FrameworkScoring }>(
    path(id),
    configuration,
    config(),
  );
  return response.data.scoring;
}

export async function previewFrameworkScoring(
  id: string,
  body: {
    configuration?: Partial<ScoringConfiguration>;
    reviewerRatings?: ReviewerRatings;
  },
  signal?: AbortSignal,
) {
  const response = await api.post<{ preview: ScoringPreview }>(
    `${path(id)}/preview`,
    body,
    config(signal),
  );
  return response.data.preview;
}
