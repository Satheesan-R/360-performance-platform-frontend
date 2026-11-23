"use client";

import { useCallback, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { buttonClass, Field, inputClass, ResourceState, secondaryClass } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import { getAssignedReviewResponse, saveAssignedReviewResponse } from "@/services/review-cycle.service";
import type { AssignedReview, ReviewResponse, ReviewSectionResponse } from "@/types/review-cycle";

type Props = { cycleId: string; participantId: string; review: AssignedReview };

function sectionResponses(form: HTMLFormElement, sections: AssignedReview["sections"]): ReviewSectionResponse[] {
  const values = new FormData(form);
  return sections.flatMap((section) => {
    const sectionId = section._id;
    if (!sectionId) return [];
    const value = (key: string) => String(values.get(`${sectionId}:${key}`) ?? "").trim();
    function numbers(ids: string[], prefix: string) {
      return Object.fromEntries(ids.flatMap((id) => {
        const input = value(`${prefix}:${id}`);
        return input === "" ? [] : [[id, Number(input)]];
      }));
    }
    return [{
      sectionId,
      ratings: numbers([...section.competencies, ...section.kpis].filter((item) => !("missing" in item)).map((item) => item._id), "rating"),
      kpiResults: numbers(section.kpis.filter((item) => !("missing" in item)).map((item) => item._id), "result"),
      answers: Object.fromEntries(section.questions.flatMap((question) => {
        const input = question._id && value(`answer:${question._id}`);
        return input ? [[question._id, input]] : [];
      })),
      comment: value("comment"),
      evidenceUrl: value("evidence"),
    }];
  });
}

function ResponseEditor({ cycleId, participantId, review, initial, onReload }: Props & { initial: ReviewResponse; onReload: () => void }) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const submitted = Boolean(saved.submittedAt);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || submitted || conflict) return;
    const submit = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "submit";
    if (submit && !window.confirm("Submit this review? Your answers will be locked.")) return;
    const sections = sectionResponses(event.currentTarget, review.sections);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await saveAssignedReviewResponse(cycleId, participantId, { version: saved.version, submit, sections });
      setSaved(response);
      setMessage(submit ? "Review submitted." : "Draft saved.");
    } catch (error) {
      setError(getApiErrorMessage(error));
      setConflict(isAxiosError(error) && error.response?.status === 409);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form key={`${saved.version}:${saved.submittedAt}`} className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
      {submitted && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Submitted on {new Date(saved.submittedAt!).toLocaleString()}.</p>}
      {message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        {conflict && <button type="button" className="mt-2 font-semibold underline" onClick={onReload}>Reload saved answers and discard local edits</button>}
      </div>}
      <fieldset disabled={busy || submitted} className="space-y-5">
        <legend className="sr-only">Review answers</legend>
        {review.sections.map((section) => {
          const sectionId = section._id;
          const previous = saved.sections.find((entry) => entry.sectionId === sectionId);
          return (
            <section key={sectionId} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold">{section.title}</h3>
              {[...section.competencies, ...section.kpis].map((criterion) => (
                "missing" in criterion ? (
                  <p key={criterion._id} className="text-sm text-amber-800">A criterion is unavailable.</p>
                ) : (
                  <div key={criterion._id} className="space-y-3 rounded-xl bg-slate-50 p-4">
                    <p className="font-semibold">{criterion.name}</p>
                    {criterion.description && <p className="text-sm text-slate-600">{criterion.description}</p>}
                    {"targetValue" in criterion && (
                      <>
                        <p className="text-sm text-slate-600">Target {criterion.targetValue} {criterion.measurementUnit}{criterion.targetPeriod ? ` · ${criterion.targetPeriod}` : ""}</p>
                        <Field label={`Actual result (${criterion.measurementUnit})`}>
                          <input name={`${sectionId}:result:${criterion._id}`} type="number" step="any" className={inputClass} defaultValue={previous?.kpiResults[criterion._id]} />
                        </Field>
                      </>
                    )}
                    <Field label={`Rating for ${criterion.name}`}>
                      <select name={`${sectionId}:rating:${criterion._id}`} className={inputClass} defaultValue={previous?.ratings[criterion._id] ?? ""}>
                        <option value="">Choose a rating</option>
                        {review.ratingScale?.levels.map((level) => <option key={level.value} value={level.value}>{level.value} · {level.label}</option>)}
                      </select>
                    </Field>
                  </div>
                )
              ))}
              {section.questions.map((question) => (
                <Field key={question._id} label={`${question.prompt}${question.required ? " *" : ""}`}>
                  <textarea name={`${sectionId}:answer:${question._id}`} maxLength={4000} rows={3} className={inputClass} defaultValue={question._id ? previous?.answers[question._id] : undefined} />
                </Field>
              ))}
              {section.allowComments && (
                <Field label={section.commentsRequired ? "Comments *" : "Comments"}>
                  <textarea name={`${sectionId}:comment`} maxLength={4000} rows={3} className={inputClass} defaultValue={previous?.comment} />
                </Field>
              )}
              <Field label={section.evidenceRequired ? "Evidence link *" : "Evidence link"}>
                <input name={`${sectionId}:evidence`} type="url" maxLength={2048} className={inputClass} defaultValue={previous?.evidenceUrl} placeholder="https://" />
              </Field>
            </section>
          );
        })}
      </fieldset>
      {!submitted && (
        <div className="flex flex-wrap gap-3">
          <button type="submit" value="draft" className={secondaryClass} disabled={busy || conflict}>Save draft</button>
          <button type="submit" value="submit" className={buttonClass} disabled={busy || conflict}>Submit review</button>
        </div>
      )}
    </form>
  );
}

export default function AssignedReviewForm(props: Props) {
  const { cycleId, participantId } = props;
  const load = useCallback((signal: AbortSignal) => getAssignedReviewResponse(cycleId, participantId, signal), [cycleId, participantId]);
  const { data, loading, error, reload } = useOrganizationResource(load);
  if (loading || error || !data) return <ResourceState loading={loading} error={error} retry={reload} />;
  return <ResponseEditor {...props} initial={data} onReload={reload} />;
}
