import type {
  ReviewTemplate,
  TemplateInput,
  TemplateQuestion,
  TemplateSection,
} from "@/types/review-template";

export interface QuestionDraft extends TemplateQuestion {
  key: string;
}
export interface SectionDraft extends Omit<TemplateSection, "questions"> {
  key: string;
  questions: QuestionDraft[];
}
export interface TemplateDraft extends Omit<TemplateInput, "sections"> {
  sections: SectionDraft[];
}

export function newTemplateSection(key: string): SectionDraft {
  return {
    key,
    title: "",
    competencyIds: [],
    kpiIds: [],
    questions: [],
    required: false,
    allowComments: true,
    commentsRequired: false,
    evidenceRequired: false,
  };
}
export function templateDraft(template?: ReviewTemplate): TemplateDraft {
  return {
    name: template?.name ?? "",
    description: template?.description ?? "",
    frameworkId: template?.frameworkId ?? "",
    employmentTypeIds: [...(template?.employmentTypeIds ?? [])],
    status: template?.status ?? "draft",
    evidenceRequired: template?.evidenceRequired ?? false,
    sections: (template?.sections ?? []).map((section, index) => ({
      ...section,
      key: section._id ?? `section-${index}`,
      questions: section.questions.map((question, index) => ({
        ...question,
        key: question._id ?? `question-${index}`,
      })),
    })),
  };
}

function text(value: string, label: string, limit: number, required = false) {
  const result = value.trim();
  if (result.length > limit || (required && !result))
    throw new Error(
      `${label} must contain ${required ? "1" : "0"} to ${limit} characters.`,
    );
  return result;
}
function id(value: string) {
  if (!/^[a-f\d]{24}$/i.test(value))
    throw new Error(
      "Select valid framework, employment type, and criterion IDs.",
    );
  return value.toLowerCase();
}
function ids(values: string[]) {
  const result = values.map(id);
  if (result.length > 100 || new Set(result).size !== result.length)
    throw new Error("Select up to 100 unique references per field.");
  return result;
}

export function templateInput(
  draft: TemplateDraft,
  existing?: ReviewTemplate,
): TemplateInput {
  if (draft.sections.length > 50)
    throw new Error("A template can have at most 50 sections.");
  if (!(["draft", "active", "archived"] as string[]).includes(draft.status))
    throw new Error("Choose a valid template status.");
  const seen = {
    competencies: new Set<string>(),
    kpis: new Set<string>(),
    sections: new Set<string>(),
    questions: new Set<string>(),
  };
  let questionCount = 0;
  const sections = draft.sections.map((section) => {
    const original = existing?.sections.find(
      (item) => item._id === section._id,
    );
    if (section._id && (!original || seen.sections.has(section._id)))
      throw new Error(
        "Section IDs must belong to this template and be unique.",
      );
    if (section._id) seen.sections.add(section._id);
    if (section.questions.length > 20)
      throw new Error("A section can have at most 20 questions.");
    questionCount += section.questions.length;
    if (questionCount > 200)
      throw new Error("A template can have at most 200 questions.");
    if (section.commentsRequired && !section.allowComments)
      throw new Error("Enable comments before making them required.");
    const competencyIds = ids(section.competencyIds),
      kpiIds = ids(section.kpiIds);
    for (const [values, seenIds] of [
      [competencyIds, seen.competencies],
      [kpiIds, seen.kpis],
    ] as const)
      for (const value of values) {
        if (seenIds.has(value))
          throw new Error("A criterion can appear in only one section.");
        seenIds.add(value);
      }
    return {
      ...(section._id ? { _id: section._id } : {}),
      title: text(section.title, "Section title", 200, true),
      competencyIds,
      kpiIds,
      required: section.required,
      allowComments: section.allowComments,
      commentsRequired: section.commentsRequired,
      evidenceRequired: section.evidenceRequired,
      questions: section.questions.map((question) => {
        if (
          question._id &&
          (!original?.questions.some((item) => item._id === question._id) ||
            seen.questions.has(question._id))
        )
          throw new Error(
            "Question IDs must belong to their section and be unique.",
          );
        if (question._id) seen.questions.add(question._id);
        return {
          ...(question._id ? { _id: question._id } : {}),
          prompt: text(question.prompt, "Question prompt", 2000, true),
          required: question.required,
        };
      }),
    };
  });
  const values: TemplateInput = {
    name: text(draft.name, "Template name", 200, true),
    description: text(draft.description, "Description", 2000),
    frameworkId: id(draft.frameworkId),
    employmentTypeIds: ids(draft.employmentTypeIds),
    evidenceRequired: draft.evidenceRequired,
    status: draft.status,
    sections,
  };
  if (new TextEncoder().encode(JSON.stringify(values)).length > 20 * 1024)
    throw new Error(
      "This template exceeds the server's 20 KB request limit. Shorten prompts or reduce sections.",
    );
  return values;
}

export function templatePatch(
  draft: TemplateDraft,
  existing?: ReviewTemplate,
): Partial<TemplateInput> {
  const values: Partial<TemplateInput> = templateInput(draft, existing);
  if (
    existing &&
    existing.frameworkId === draft.frameworkId &&
    existing.employmentTypeIds.length === draft.employmentTypeIds.length &&
    existing.employmentTypeIds.every((id) =>
      draft.employmentTypeIds.includes(id),
    )
  )
    delete values.employmentTypeIds;
  return values;
}
