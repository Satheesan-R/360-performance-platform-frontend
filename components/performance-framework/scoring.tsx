"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import {
  scoringDraft,
  scoringInput,
  type ScoringDraft,
} from "@/lib/framework-scoring";
import {
  getCriteriaFramework,
  getCriteriaFrameworks,
} from "@/services/framework-criteria.service";
import {
  getFrameworkScoring,
  previewFrameworkScoring,
  saveFrameworkScoring,
} from "@/services/framework-scoring.service";
import { saveFramework } from "@/services/performance-framework.service";
import type {
  FrameworkScoring,
  ScoringConfiguration,
  ScoringPreview,
} from "@/types/framework-scoring";
import type { PerformanceFramework } from "@/types/performance-framework";
import {
  buttonClass,
  Field,
  inputClass,
  PageHeading,
  secondaryClass,
} from "@/components/organization/ui";
import CriteriaLoadState from "./criteria-load-state";
import RatingScaleEditor from "./rating-scale-editor";
import ScoringWeightsEditor from "./scoring-weights-editor";
import ScoringPreviewPanel from "./scoring-preview";

function ScoringEditor({
  settings,
  framework,
  onReload,
  onLock,
}: {
  settings: FrameworkScoring;
  framework: PerformanceFramework;
  onReload: (message?: string) => void;
  onLock: (locked: boolean) => void;
}) {
  const [draft, setDraft] = useState(() => scoringDraft(settings));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [preview, setPreview] = useState<{
    result: ScoringPreview;
    configuration?: Partial<ScoringConfiguration>;
  } | null>(null);
  const readOnly = framework.status === "archived";
  const disabled = busy || sampleBusy || conflict;

  function change(value: ScoringDraft) {
    setDraft(value);
    setDirty(true);
    onLock(true);
    setPreview(null);
    setError("");
  }
  function report(error: unknown) {
    setError(getApiErrorMessage(error));
    const conflict = isAxiosError(error) && error.response?.status === 409;
    if (conflict) setConflict(true);
    return conflict;
  }

  async function save() {
    if (disabled || readOnly) return;
    setError("");
    setPreview(null);
    let conflict = false;
    let saved = false;
    try {
      const configuration = scoringInput(draft);
      setBusy(true);
      onLock(true);
      await saveFrameworkScoring(framework._id, configuration);
      saved = true;
      onReload("Scoring settings saved.");
    } catch (error) {
      conflict = report(error);
    } finally {
      setBusy(false);
      onLock(saved ? false : dirty || conflict);
    }
  }

  async function showPreview(proposed: boolean) {
    if (disabled) return;
    setError("");
    setPreview(null);
    let conflict = false;
    try {
      const configuration = proposed ? scoringInput(draft) : undefined;
      setBusy(true);
      onLock(true);
      const result = await previewFrameworkScoring(
        framework._id,
        configuration ? { configuration } : {},
      );
      setPreview({ result, configuration });
    } catch (error) {
      conflict = report(error);
    } finally {
      setBusy(false);
      onLock(dirty || conflict);
    }
  }

  async function setStatus(status: "draft" | "active") {
    if (disabled || dirty) return;
    setError("");
    setBusy(true);
    onLock(true);
    let conflict = false;
    try {
      await saveFramework({ status }, framework._id);
      onReload(`Framework moved to ${status}.`);
    } catch (error) {
      conflict = report(error);
    } finally {
      setBusy(false);
      onLock(conflict);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{framework.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            <span className="capitalize">{framework.status}</span> · Saved
            version {settings.version}
            {dirty ? " · Unsaved changes" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {framework.status !== "draft" && (
            <button
              type="button"
              className={secondaryClass}
              disabled={disabled || dirty}
              onClick={() => void setStatus("draft")}
            >
              Move to draft
            </button>
          )}
          {framework.status === "draft" && (
            <button
              type="button"
              className={buttonClass}
              disabled={disabled || dirty || !settings.validation.ready}
              onClick={() => void setStatus("active")}
            >
              Activate Framework
            </button>
          )}
          <button
            type="button"
            className={secondaryClass}
            disabled={busy || sampleBusy}
            onClick={() => onReload()}
          >
            Reload saved settings
          </button>
        </div>
      </div>
      <div
        className={`mb-5 rounded-xl p-4 text-sm ${settings.validation.ready ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
      >
        <p className="font-semibold">
          {settings.validation.ready
            ? "Saved configuration is ready"
            : "Saved configuration is incomplete"}
        </p>
        {settings.validation.message && (
          <p className="mt-2">{settings.validation.message}</p>
        )}
        <p className="mt-2">
          Readiness reflects saved settings and active criteria. Use Preview
          changes to check unsaved settings.
        </p>
      </div>
      {readOnly && (
        <p className="mb-5 text-sm text-slate-600">
          Archived scoring is read-only. Move to draft to make changes.
        </p>
      )}
      {framework.status === "active" && (
        <p className="mb-5 text-sm text-slate-600">
          Active edits must keep all criteria and scoring settings valid. Move
          to draft before making an incomplete configuration.
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>
          {conflict && (
            <>
              <p className="mt-2">
                Reload the latest settings before retrying. Reloading discards
                unsaved changes.
              </p>
              <button
                type="button"
                className={`${secondaryClass} mt-3`}
                onClick={() => onReload()}
              >
                Reload latest settings
              </button>
            </>
          )}
        </div>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <RatingScaleEditor
          draft={draft}
          disabled={disabled || readOnly}
          onChange={change}
        />
        <ScoringWeightsEditor
          draft={draft}
          disabled={disabled || readOnly}
          onChange={change}
        />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || readOnly}
          onClick={() => void save()}
        >
          {busy ? "Working..." : "Save scoring settings"}
        </button>
        <button
          type="button"
          className={secondaryClass}
          disabled={disabled || readOnly}
          onClick={() => void showPreview(true)}
        >
          Preview changes
        </button>
        <button
          type="button"
          className={secondaryClass}
          disabled={disabled}
          onClick={() => void showPreview(false)}
        >
          Preview saved settings
        </button>
      </div>
      {dirty && (
        <p className="mt-3 text-xs text-slate-500">
          Save or reload before changing frameworks. Reload discards unsaved
          changes.
        </p>
      )}
      {preview && (
        <ScoringPreviewPanel
          preview={preview.result}
          configuration={preview.configuration}
          disabled={disabled}
          onBusy={(busy) => {
            setSampleBusy(busy);
            onLock(busy || dirty || conflict);
          }}
        />
      )}
      <p className="mt-6 text-xs leading-5 text-slate-500">
        Published review cycles will use a versioned snapshot of the framework.
        Saving these settings updates the current framework; it does not publish
        a cycle or create a snapshot.
      </p>
    </>
  );
}

function ScoringSession({
  id,
  onReload,
  onLock,
}: {
  id: string;
  onReload: (message?: string) => void;
  onLock: (locked: boolean) => void;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [framework, settings] = await Promise.all([
        getCriteriaFramework(id, signal),
        getFrameworkScoring(id, signal),
      ]);
      return { framework, settings };
    },
    [id],
  );
  const resource = useOrganizationResource(load);
  return (
    <>
      <CriteriaLoadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!resource.loading && !resource.error && resource.data && (
        <ScoringEditor
          settings={resource.data.settings}
          framework={resource.data.framework}
          onReload={onReload}
          onLock={onLock}
        />
      )}
    </>
  );
}

export default function FrameworkScoringPage() {
  const frameworks = useOrganizationResource(getCriteriaFrameworks);
  const [selectedId, setSelectedId] = useState("");
  const [locked, setLocked] = useState(false);
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState("");
  const id = selectedId || frameworks.data?.[0]?._id || "";
  return (
    <>
      <PageHeading
        title="Rating Scales & Weightages"
        description="Define rating labels, competency category weights, and reviewer contributions."
      />
      {message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {message}
        </p>
      )}
      <CriteriaLoadState
        loading={frameworks.loading}
        error={frameworks.error}
        retry={frameworks.reload}
      />
      {!frameworks.loading &&
        !frameworks.error &&
        frameworks.data &&
        (frameworks.data.length ? (
          <>
            <div className="mb-6 max-w-xl">
              <Field label="Framework">
                <select
                  className={inputClass}
                  value={id}
                  disabled={locked}
                  onChange={(event) => {
                    setSelectedId(event.target.value);
                    setMessage("");
                  }}
                >
                  {frameworks.data.map((framework) => (
                    <option
                      key={framework._id}
                      value={framework._id}
                    >
                      {framework.name} · {framework._id.slice(-6)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <ScoringSession
              key={`${id}:${version}`}
              id={id}
              onLock={setLocked}
              onReload={(message = "") => {
                setLocked(false);
                setMessage(message);
                setVersion((version) => version + 1);
              }}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-lg font-semibold">Create a framework first</h2>
            <p className="mb-6 mt-2 text-sm text-slate-500">
              Rating scales and weights belong to a performance framework.
            </p>
            <Link
              className={secondaryClass}
              href="/hr/performance-framework"
            >
              Go to Framework Overview
            </Link>
          </div>
        ))}
    </>
  );
}
