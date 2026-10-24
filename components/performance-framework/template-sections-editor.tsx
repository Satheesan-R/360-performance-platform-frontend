"use client";

import { newTemplateSection, type SectionDraft } from "@/lib/review-template";
import type { Competency, Kpi } from "@/types/framework-criteria";
import {
  Field,
  inputClass,
  secondaryClass,
} from "@/components/organization/ui";

export default function TemplateSectionsEditor({
  sections,
  competencies,
  kpis,
  disabled,
  onChange,
}: {
  sections: SectionDraft[];
  competencies: Competency[];
  kpis: Kpi[];
  disabled: boolean;
  onChange: (sections: SectionDraft[]) => void;
}) {
  const update = (index: number, section: SectionDraft) =>
    onChange(
      sections.map((item, position) => (position === index ? section : item)),
    );
  const questionCount = sections.reduce(
    (sum, section) => sum + section.questions.length,
    0,
  );
  function move(index: number, direction: number) {
    const next = [...sections];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  }
  return (
    <fieldset
      disabled={disabled}
      className="mt-6 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Sections</h3>
          <p className="mt-1 text-sm text-slate-500">
            {sections.length} / 50 sections · {questionCount} / 200 questions
          </p>
        </div>
        <button
          type="button"
          className={secondaryClass}
          disabled={sections.length >= 50}
          onClick={() =>
            onChange([...sections, newTemplateSection(crypto.randomUUID())])
          }
        >
          + Add Section
        </button>
      </div>
      {!sections.length && (
        <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
          Add sections to organize criteria, questions, comments, and evidence
          rules. Drafts can be saved without sections.
        </p>
      )}
      {sections.map((section, index) => (
        <section
          key={section.key}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold">Section {index + 1}</h4>
            <div className="flex gap-3">
              <button
                type="button"
                className="text-sm font-semibold text-blue-600 disabled:opacity-40"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                Move up
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-blue-600 disabled:opacity-40"
                disabled={index === sections.length - 1}
                onClick={() => move(index, 1)}
              >
                Move down
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-red-600"
                onClick={() =>
                  onChange(sections.filter((_, position) => position !== index))
                }
              >
                Remove section
              </button>
            </div>
          </div>
          <Field label="Section title *">
            <input
              className={inputClass}
              maxLength={200}
              value={section.title}
              onChange={(event) =>
                update(index, { ...section, title: event.target.value })
              }
            />
          </Field>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {(
              [
                {
                  key: "competencyIds",
                  title: "Competencies",
                  options: competencies,
                },
                { key: "kpiIds", title: "KPIs", options: kpis },
              ] as const
            ).map(({ key, title, options }) => (
              <fieldset
                key={key}
                className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-4"
              >
                <legend className="px-2 text-sm font-semibold">{title}</legend>
                {options
                  .filter(
                    (item) =>
                      item.status === "active" ||
                      section[key].includes(item._id),
                  )
                  .map((item) => {
                    const elsewhere = sections.some(
                      (other, position) =>
                        position !== index && other[key].includes(item._id),
                    );
                    return (
                      <label
                        key={item._id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={section[key].includes(item._id)}
                          disabled={
                            elsewhere ||
                            (item.status !== "active" &&
                              !section[key].includes(item._id))
                          }
                          onChange={(event) =>
                            update(index, {
                              ...section,
                              [key]: event.target.checked
                                ? [...section[key], item._id]
                                : section[key].filter((id) => id !== item._id),
                            })
                          }
                        />
                        <span>
                          {item.name}
                          {elsewhere
                            ? " (in another section)"
                            : item.status !== "active"
                              ? " (inactive)"
                              : ""}
                        </span>
                      </label>
                    );
                  })}
                {section[key]
                  .filter((id) => !options.some((item) => item._id === id))
                  .map((id) => (
                    <label
                      key={id}
                      className="flex gap-3 text-sm text-red-700"
                    >
                      <input
                        type="checkbox"
                        checked
                        onChange={() =>
                          update(index, {
                            ...section,
                            [key]: section[key].filter((value) => value !== id),
                          })
                        }
                      />
                      Missing criterion ({id.slice(-6)}) — uncheck to remove
                    </label>
                  ))}
                {!options.some((item) => item.status === "active") &&
                  !section[key].length && (
                    <p className="text-sm text-slate-500">
                      No active {title.toLowerCase()} in this framework.
                    </p>
                  )}
              </fieldset>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-5">
            {(
              [
                { key: "required", label: "Section required" },
                { key: "allowComments", label: "Allow comments" },
                { key: "commentsRequired", label: "Comments required" },
                { key: "evidenceRequired", label: "Evidence required" },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={section[key]}
                  disabled={
                    key === "commentsRequired" && !section.allowComments
                  }
                  onChange={(event) =>
                    update(index, {
                      ...section,
                      [key]: event.target.checked,
                      ...(key === "allowComments" && !event.target.checked
                        ? { commentsRequired: false }
                        : {}),
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <h5 className="text-sm font-semibold">
              Free-text questions ({section.questions.length} / 20)
            </h5>
            <button
              type="button"
              className="text-sm font-semibold text-blue-600 disabled:opacity-40"
              disabled={section.questions.length >= 20 || questionCount >= 200}
              onClick={() =>
                update(index, {
                  ...section,
                  questions: [
                    ...section.questions,
                    { key: crypto.randomUUID(), prompt: "", required: false },
                  ],
                })
              }
            >
              + Add Question
            </button>
          </div>
          <div className="mt-3 space-y-4">
            {section.questions.map((question, position) => (
              <div
                key={question.key}
                className="rounded-xl bg-slate-50 p-4"
              >
                <Field label={`Question ${position + 1} prompt *`}>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    className={inputClass}
                    value={question.prompt}
                    onChange={(event) =>
                      update(index, {
                        ...section,
                        questions: section.questions.map((item, q) =>
                          q === position
                            ? { ...item, prompt: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
                <div className="mt-3 flex justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(event) =>
                        update(index, {
                          ...section,
                          questions: section.questions.map((item, q) =>
                            q === position
                              ? { ...item, required: event.target.checked }
                              : item,
                          ),
                        })
                      }
                    />
                    Answer required
                  </label>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-600"
                    onClick={() =>
                      update(index, {
                        ...section,
                        questions: section.questions.filter(
                          (_, q) => q !== position,
                        ),
                      })
                    }
                  >
                    Remove question
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </fieldset>
  );
}
