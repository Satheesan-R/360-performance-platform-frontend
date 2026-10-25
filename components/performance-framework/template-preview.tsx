"use client";

import ReviewFormPreview from "./review-form-preview";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import {
  createTemplateSnapshot,
  getTemplatePreview,
  getTemplateSnapshot,
} from "@/services/review-template.service";
import type {
  ResolvedTemplateSection,
  TemplatePreview,
  TemplateSnapshot,
} from "@/types/review-template";
import {
  buttonClass,
  Field,
  inputClass,
  secondaryClass,
} from "@/components/organization/ui";

export function TemplateSectionPreview({
  sections,
}: {
  sections: ResolvedTemplateSection[];
}) {
  return (
    <div className="mt-5 space-y-5">
      {sections.map((section, index) => (
        <section
          key={section._id ?? index}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h3 className="text-lg font-semibold">
            {index + 1}. {section.title}
          </h3>
          <p className="mt-2 text-xs text-slate-500">
            {section.required ? "Required section" : "Optional section"} ·{" "}
            {section.evidenceRequired
              ? "Evidence required"
              : "Evidence optional"}
          </p>
          {!!section.competencies.length && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Competencies</h4>
              <ul className="mt-2 space-y-2 text-sm">
                {section.competencies.map((item) => (
                  <li
                    key={item._id}
                    className={
                      "missing" in item ? "text-red-700" : "text-slate-700"
                    }
                  >
                    {"missing" in item
                      ? `Missing competency (${item._id.slice(-6)})`
                      : `${item.name} · ${item.category} · ${item.weight}%`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!section.kpis.length && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">KPIs</h4>
              <ul className="mt-2 space-y-2 text-sm">
                {section.kpis.map((item) => (
                  <li
                    key={item._id}
                    className={
                      "missing" in item ? "text-red-700" : "text-slate-700"
                    }
                  >
                    {"missing" in item
                      ? `Missing KPI (${item._id.slice(-6)})`
                      : `${item.name} · Target: ${item.targetValue} ${item.measurementUnit}${item.targetPeriod ? ` · ${item.targetPeriod}` : ""} · ${item.weight}%`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!section.questions.length && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold">Questions</h4>
              {section.questions.map((question, index) => (
                <div
                  key={question._id ?? index}
                  className="rounded-xl bg-slate-50 p-4 text-sm"
                >
                  <p className="whitespace-pre-wrap">{question.prompt}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {question.required ? "Answer required" : "Answer optional"}
                  </p>
                </div>
              ))}
            </div>
          )}
          {section.allowComments && (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Comments field ·{" "}
              {section.commentsRequired ? "Required" : "Optional"}
            </p>
          )}
        </section>
      ))}
      {!sections.length && (
        <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
          No sections configured.
        </p>
      )}
    </div>
  );
}

export function TemplatePreviewContent({
  preview,
  proposed = false,
}: {
  preview: TemplatePreview;
  proposed?: boolean;
}) {
  return (
    <section className="mt-5">
      <h2 className="text-xl font-semibold">{preview.name}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
        {preview.description}
      </p>
      <p className="mt-3 text-sm text-slate-500">
        {proposed ? "Unsaved changes" : "Saved template"} ·{" "}
        {preview.frameworkName} · Framework version {preview.frameworkVersion} ·{" "}
        {preview.usesFrozenFramework
          ? "Pinned configuration"
          : "Current live configuration"}
      </p>
      <div
        className={`mt-4 rounded-xl p-4 text-sm ${preview.validation.ready ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
      >
        <p className="font-semibold">
          {preview.validation.ready
            ? "Ready for activation"
            : "Not ready for activation"}
        </p>
        {preview.validation.message && (
          <p className="mt-2">{preview.validation.message}</p>
        )}
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {preview.effectiveEmploymentTypeIds.length
          ? `Effective employment types: ${preview.effectiveEmploymentTypeIds.map((id) => id.slice(-6)).join(", ")}${preview.employmentTypeIds.length ? " (explicit selection)" : " (inherited from framework)"}`
          : "No employment-type restriction configured."}{" "}
        Employee assignment is handled by future review workflows.
      </p>
      {preview.ratingScale && (
        <div className="mt-4 rounded-xl bg-white p-4 text-sm">
          <h3 className="font-semibold">
            Rating scale {preview.ratingScale.min}–{preview.ratingScale.max}
          </h3>
          <p className="mt-2">
            {preview.ratingScale.levels
              .map((level) => `${level.value}: ${level.label}`)
              .join(" · ")}
          </p>
        </div>
      )}
      <TemplateSectionPreview sections={preview.sections} />
      {!!preview.criteriaWeights.length && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="p-4 text-left font-semibold">
              Effective scoring weights
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3"
                >
                  Criterion
                </th>
                <th
                  scope="col"
                  className="px-4 py-3"
                >
                  Effective weight
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.criteriaWeights.map((item) => (
                <tr key={item.criterionId}>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">
                    {item.effectiveWeight.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-5 text-xs text-slate-500">
        Configuration preview only. Review answers, evidence uploads, and
        submissions are not collected here.
      </p>
    </section>
  );
}

export function SavedTemplatePreview({
  id,
  onBack,
  onActivate,
}: {
  id: string;
  onBack: () => void;
  onActivate: () => void;
}) {
  const load = useCallback(
    (signal: AbortSignal) => getTemplatePreview(id, signal),
    [id],
  );
  const resource = useOrganizationResource(load);
  return (
    <>
      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          className={secondaryClass}
          onClick={onBack}
        >
          Back to templates
        </button>
        {resource.data &&
          !resource.loading &&
          !resource.error &&
          resource.data.status !== "active" && (
            <button
              type="button"
              className={buttonClass}
              disabled={!resource.data.validation.ready}
              onClick={onActivate}
            >
              Activate Template
            </button>
          )}
      </div>
      {resource.loading && <p role="status">Loading template preview...</p>}
      {resource.error && (
        <div
          role="alert"
          className="text-sm text-red-700"
        >
          <p>{resource.error}</p>
          <button
            type="button"
            className={`${secondaryClass} mt-3`}
            onClick={resource.reload}
          >
            Try again
          </button>
        </div>
      )}
      {resource.data && !resource.loading && !resource.error && (
        <TemplatePreviewContent preview={resource.data} />
      )}
    </>
  );
}

export function TemplateSnapshots({
  id,
  active,
  onBack,
}: {
  id: string;
  active: boolean;
  onBack: () => void;
}) {
  const [snapshot, setSnapshot] = useState<TemplateSnapshot | null>(null);
  const [snapshotId, setSnapshotId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function open(create: boolean) {
    if (busy) return;
    if (!create && !/^[a-f\d]{24}$/i.test(snapshotId.trim())) {
      setError("Enter a valid snapshot ID.");
      return;
    }
    setBusy(true);
    setError("");
    setSnapshot(null);
    try {
      const result = create
        ? await createTemplateSnapshot(id)
        : await getTemplateSnapshot(id, snapshotId.trim());
      setSnapshot(result);
      setSnapshotId(result._id);
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const config = snapshot?.configuration;
  const sections: ResolvedTemplateSection[] =
    config?.sections.map((section) => ({
      ...section,
      evidenceRequired: config.evidenceRequired || section.evidenceRequired,
      competencies: section.competencyIds.map(
        (id) =>
          config.framework.competencies.find((item) => item._id === id) ?? {
            _id: id,
            missing: true,
          },
      ),
      kpis: section.kpiIds.map(
        (id) =>
          config.framework.kpis.find((item) => item._id === id) ?? {
            _id: id,
            missing: true,
          },
      ),
    })) ?? [];
  return (
    <>
      <div className="mb-5 flex gap-3">
        <button
          type="button"
          className={secondaryClass}
          disabled={busy}
          onClick={onBack}
        >
          Back to templates
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={busy || !active}
          onClick={() => void open(true)}
        >
          {busy ? "Working..." : "Create version snapshot"}
        </button>
      </div>
      <h2 className="text-xl font-semibold">Template snapshots</h2>
      <p className="mb-5 mt-2 text-sm text-slate-500">
        Snapshots preserve the saved template and its pinned framework.
        Repeating creation for the same version returns the same snapshot. No
        review cycle is published.
      </p>
      {!active && (
        <p className="mb-4 text-sm text-amber-700">
          Activate the template before creating a snapshot. Existing snapshots
          can still be opened by ID.
        </p>
      )}
      <form
        className="mb-5 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void open(false);
        }}
      >
        <div className="min-w-64 flex-1">
          <Field label="Open snapshot by ID">
            <input
              className={inputClass}
              value={snapshotId}
              disabled={busy}
              onChange={(event) => setSnapshotId(event.target.value)}
            />
          </Field>
        </div>
        <button
          type="submit"
          className={secondaryClass}
          disabled={busy}
        >
          Open snapshot
        </button>
      </form>
      {error && (
        <p
          role="alert"
          className="mb-5 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {snapshot && config && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">{config.name}</h3>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Snapshot ID", snapshot._id],
              ["Template version", snapshot.sourceVersion],
              ["Framework", config.framework.name],
              ["Pinned framework version", config.frameworkVersion],
              ["Created", new Date(snapshot.createdAt).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="mt-1 break-all font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
            {config.description}
          </p>
          <TemplateSectionPreview sections={sections} />
        </div>
      )}
    </>
  );
}
