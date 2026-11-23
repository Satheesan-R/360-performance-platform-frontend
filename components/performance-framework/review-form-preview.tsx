"use client";

import { useId, useState } from "react";
import type { RatingScale } from "@/types/framework-scoring";
import type { ResolvedTemplateSection } from "@/types/review-template";

const controlClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

function ReviewSection({ section, index, scale }: {
  section: ResolvedTemplateSection;
  index: number;
  scale: RatingScale | null;
}) {
  const prefix = useId();
  const [included, setIncluded] = useState(true);

  function rating(id: string, name: string) {
    return (
      <fieldset className="mt-4" disabled={!scale}>
        <legend className="text-sm font-medium">Rating for {name} *</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {scale?.levels.map((level) => (
            <label key={level.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm has-checked:border-blue-500 has-checked:bg-blue-50">
              <input type="radio" name={`${prefix}-${id}`} value={level.value} required />
              {level.value} — {level.label}
            </label>
          ))}
        </div>
        {!scale && <p className="mt-2 text-sm text-amber-700">Configure a rating scale to preview rating choices.</p>}
      </fieldset>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{index + 1}. {section.title}</h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {section.required ? "Required section" : "Optional section"}
        </span>
      </div>
      {!section.required && (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={included} onChange={(event) => setIncluded(event.target.checked)} />
          Complete this optional section
        </label>
      )}
      <fieldset disabled={!included} className="mt-5 space-y-6 disabled:opacity-50">
        {(["technical", "behavioral"] as const).map((category) => {
          const items = section.competencies.filter((item) => !("missing" in item) && item.category === category);
          return items.length > 0 && (
            <div key={category} className="space-y-4">
              <h4 className="font-semibold">{category === "technical" ? "Technical competencies" : "Behavioural competencies"}</h4>
              {items.map((item) => "missing" in item ? null : (
                <div key={item._id} className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{item.description}</p>
                  {rating(item._id, item.name)}
                </div>
              ))}
            </div>
          );
        })}
        {section.competencies.filter((item) => "missing" in item).map((item) => (
          <p key={item._id} role="alert" className="text-sm text-red-700">Missing competency ({item._id.slice(-6)})</p>
        ))}
        {section.kpis.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold">KPIs &amp; goal results</h4>
            {section.kpis.map((item) => "missing" in item ? (
              <p key={item._id} role="alert" className="text-sm text-red-700">Missing KPI ({item._id.slice(-6)})</p>
            ) : (
              <div key={item._id} className="rounded-xl bg-slate-50 p-4">
                <p className="font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                <p className="mt-2 text-sm">Target: {item.targetValue} {item.measurementUnit}{item.targetPeriod ? ` · ${item.targetPeriod}` : ""}</p>
                <label className="mt-4 block text-sm font-medium">
                  Actual result ({item.measurementUnit}) *
                  <input type="number" step="any" required className={controlClass} placeholder="Enter achieved result" />
                </label>
                {rating(item._id, item.name)}
              </div>
            ))}
          </div>
        )}
        {section.questions.map((question, questionIndex) => (
          <label key={question._id ?? questionIndex} className="block text-sm font-medium">
            {question.prompt} {question.required ? "*" : "(optional)"}
            <span className="mt-1 block text-xs font-normal text-slate-500">{question.required ? "Answer required" : "Answer optional"}</span>
            <textarea rows={3} required={question.required} className={controlClass} placeholder="Write your answer" />
          </label>
        ))}
        {section.allowComments && (
          <label className="block text-sm font-medium">
            Comments field {section.commentsRequired ? "*" : "(optional)"}
            <textarea rows={4} required={section.commentsRequired} className={controlClass} placeholder="Share examples and feedback" />
          </label>
        )}
        <label className="block text-sm font-medium">
          {section.evidenceRequired ? "Evidence required *" : "Evidence (optional)"}
          <input type="file" required={section.evidenceRequired} className={controlClass} />
          <span className="mt-2 block text-xs font-normal text-slate-500">Preview only. Selected files are not uploaded.</span>
        </label>
      </fieldset>
    </section>
  );
}

export default function ReviewFormPreview({ sections, scale }: {
  sections: ResolvedTemplateSection[];
  scale: RatingScale | null;
}) {
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  return (
    <form
      className="mt-6 space-y-6"
      onChange={() => setMessage("")}
      onReset={() => { setMessage(""); setRevision((value) => value + 1); }}
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("Preview fields are complete. No review has been submitted or saved.");
      }}
    >
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Try filling out this review form. Preview answers are temporary and are cleared when you leave.
      </div>
      {sections.map((section, index) => (
        <ReviewSection key={`${revision}:${section._id ?? index}`} section={section} index={index} scale={scale} />
      ))}
      {!sections.length && <p className="rounded-xl bg-white p-6 text-sm text-slate-500">No sections configured.</p>}
      {sections.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Check preview form</button>
          <button type="reset" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold">Clear preview answers</button>
        </div>
      )}
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    </form>
  );
}
