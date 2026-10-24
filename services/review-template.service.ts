import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  ReviewTemplate,
  TemplateInput,
  TemplateList,
  TemplatePreview,
  TemplateSnapshot,
} from "@/types/review-template";

function config(signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}
function path(id: string) {
  return `/review-templates/${encodeURIComponent(id)}`;
}

export async function getReviewTemplates(
  filters: {
    search: string;
    status: string;
    frameworkId: string;
    page: number;
  },
  signal?: AbortSignal,
) {
  const response = await api.get<TemplateList>("/review-templates", {
    ...config(signal),
    params: {
      ...filters,
      status: filters.status || undefined,
      frameworkId: filters.frameworkId || undefined,
      limit: 20,
    },
  });
  return response.data;
}
export async function getReviewTemplate(id: string, signal?: AbortSignal) {
  const response = await api.get<{ template: ReviewTemplate }>(
    path(id),
    config(signal),
  );
  return response.data.template;
}
export async function saveReviewTemplate(
  values: Partial<TemplateInput>,
  id?: string,
) {
  const response = id
    ? await api.patch<{ template: ReviewTemplate }>(path(id), values, config())
    : await api.post<{ template: ReviewTemplate }>(
        "/review-templates",
        values,
        config(),
      );
  return response.data.template;
}
export async function getTemplatePreview(id: string, signal?: AbortSignal) {
  const response = await api.get<{ preview: TemplatePreview }>(
    `${path(id)}/preview`,
    config(signal),
  );
  return response.data.preview;
}
export async function previewTemplateChanges(
  id: string,
  values: Partial<TemplateInput>,
) {
  const response = await api.post<{ preview: TemplatePreview }>(
    `${path(id)}/preview`,
    values,
    config(),
  );
  return response.data.preview;
}
export async function createTemplateSnapshot(id: string) {
  const response = await api.post<{ snapshot: TemplateSnapshot }>(
    `${path(id)}/snapshots`,
    {},
    config(),
  );
  return response.data.snapshot;
}
export async function getTemplateSnapshot(
  id: string,
  snapshotId: string,
  signal?: AbortSignal,
) {
  const response = await api.get<{ snapshot: TemplateSnapshot }>(
    `${path(id)}/snapshots/${encodeURIComponent(snapshotId)}`,
    config(signal),
  );
  return response.data.snapshot;
}
