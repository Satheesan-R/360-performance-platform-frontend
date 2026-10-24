"use client";

import { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getApiErrorMessage } from "@/lib/api";
import { getCriteriaFrameworks } from "@/services/framework-criteria.service";
import {
  getReviewTemplates,
  saveReviewTemplate,
} from "@/services/review-template.service";
import type { FrameworkStatus } from "@/types/performance-framework";
import type { TemplateListItem } from "@/types/review-template";
import {
  buttonClass,
  Field,
  inputClass,
  PageHeading,
  secondaryClass,
} from "@/components/organization/ui";
import TemplateEditor from "./template-editor";
import { SavedTemplatePreview, TemplateSnapshots } from "./template-preview";

type Filters = {
  search: string;
  status: string;
  frameworkId: string;
  page: number;
};
type View =
  | { kind: "edit"; id?: string }
  | { kind: "preview" | "snapshots"; item: TemplateListItem }
  | null;

function TemplatesTable({
  filters,
  disabled,
  onView,
  onStatus,
  onPage,
}: {
  filters: Filters;
  disabled: boolean;
  onView: (view: View) => void;
  onStatus: (item: TemplateListItem, status: FrameworkStatus) => void;
  onPage: (page: number) => void;
}) {
  const load = useCallback(
    (signal: AbortSignal) => getReviewTemplates(filters, signal),
    [filters],
  );
  const resource = useOrganizationResource(load);
  if (resource.loading)
    return (
      <p
        role="status"
        className="rounded-xl bg-white p-6 text-sm text-slate-500"
      >
        Loading review templates...
      </p>
    );
  if (resource.error)
    return (
      <div
        role="alert"
        className="rounded-xl bg-red-50 p-5 text-sm text-red-700"
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
    );
  const data = resource.data;
  return (
    data && (
      <>
        {!data.templates.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="font-semibold">No review templates found</h2>
            <p className="mt-2 text-sm text-slate-500">
              {filters.search || filters.status || filters.frameworkId
                ? "Try another search or filter."
                : "Create your first template to organize review criteria and questions."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    "Template",
                    "Framework",
                    "Employment types",
                    "Sections",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.templates.map((item) => (
                  <tr key={item._id}>
                    <td className="min-w-56 px-5 py-4">
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 max-w-sm whitespace-pre-wrap break-words text-xs text-slate-500">
                        {item.description || "No description"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Version {item.__v ?? 0}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{item.frameworkId?.name || "Unavailable framework"}</p>
                      {item.frameworkVersion != null && (
                        <p className="mt-1 text-xs text-slate-500">
                          Pinned version {item.frameworkVersion}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.employmentTypeIds.length
                        ? item.employmentTypeIds
                            .map(
                              (type) =>
                                `${type.name}${type.isActive ? "" : " (inactive)"}`,
                            )
                            .join(", ")
                        : "Inherit framework targeting"}
                    </td>
                    <td className="px-5 py-4">{item.sections.length}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : item.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="min-w-60 px-5 py-4">
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <button
                          type="button"
                          className="font-semibold text-blue-600 disabled:opacity-40"
                          disabled={disabled}
                          onClick={() => onView({ kind: "preview", item })}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className="font-semibold text-blue-600 disabled:opacity-40"
                          disabled={disabled || item.status === "archived"}
                          onClick={() => onView({ kind: "edit", id: item._id })}
                        >
                          Edit
                        </button>
                        {item.status !== "draft" && (
                          <button
                            type="button"
                            className="font-semibold text-blue-600 disabled:opacity-40"
                            disabled={disabled}
                            onClick={() => onStatus(item, "draft")}
                          >
                            Move to draft
                          </button>
                        )}
                        {item.status !== "archived" && (
                          <button
                            type="button"
                            className="font-semibold text-red-600 disabled:opacity-40"
                            disabled={disabled}
                            onClick={() => onStatus(item, "archived")}
                          >
                            Archive
                          </button>
                        )}
                        <button
                          type="button"
                          className="font-semibold text-blue-600 disabled:opacity-40"
                          disabled={disabled}
                          onClick={() => onView({ kind: "snapshots", item })}
                        >
                          Snapshots
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-sm text-slate-500">
          {data.pagination.total} templates · Page {data.pagination.page} of{" "}
          {Math.max(1, data.pagination.totalPages)}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className={secondaryClass}
            disabled={disabled || filters.page <= 1}
            onClick={() => onPage(filters.page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className={secondaryClass}
            disabled={disabled || filters.page >= data.pagination.totalPages}
            onClick={() => onPage(filters.page + 1)}
          >
            Next
          </button>
        </div>
      </>
    )
  );
}

export default function ReviewTemplatesPage() {
  const frameworks = useOrganizationResource(getCriteriaFrameworks);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    frameworkId: "",
    page: 1,
  });
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>(null);
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState<{
    item: TemplateListItem;
    status: FrameworkStatus;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function back(message = "") {
    setView(null);
    setPending(null);
    setError("");
    setConflict(false);
    setMessage(message);
    setVersion((version) => version + 1);
  }
  function request(item: TemplateListItem, status: FrameworkStatus) {
    setView(null);
    setPending({ item, status });
    setError("");
    setMessage("");
  }
  async function changeStatus() {
    if (!pending || busy || conflict) return;
    setBusy(true);
    setError("");
    try {
      await saveReviewTemplate({ status: pending.status }, pending.item._id);
      back(`Template moved to ${pending.status}.`);
    } catch (error) {
      setError(getApiErrorMessage(error));
      if (isAxiosError(error) && error.response?.status === 409)
        setConflict(true);
    } finally {
      setBusy(false);
    }
  }
  const locked = busy || Boolean(pending);
  return (
    <>
      <PageHeading
        title="Review Templates"
        description="Organize framework criteria, questions, comments, and evidence rules for reviews."
      >
        {!view && (
          <button
            type="button"
            className={buttonClass}
            disabled={locked}
            onClick={() => {
              setView({ kind: "edit" });
              setMessage("");
            }}
          >
            + Create Template
          </button>
        )}
      </PageHeading>
      {message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {message}
        </p>
      )}
      {view?.kind === "edit" ? (
        <TemplateEditor
          key={view.id ?? "new"}
          id={view.id}
          onCancel={() => back()}
          onSaved={() => back("Review template saved.")}
        />
      ) : view?.kind === "preview" ? (
        <SavedTemplatePreview
          id={view.item._id}
          onBack={() => back()}
          onActivate={() => request(view.item, "active")}
        />
      ) : view?.kind === "snapshots" ? (
        <TemplateSnapshots
          id={view.item._id}
          active={view.item.status === "active"}
          onBack={() => back()}
        />
      ) : (
        <>
          {pending && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-semibold">
                Move {pending.item.name} to {pending.status}?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {pending.status === "draft"
                  ? "Returning to draft clears the pinned framework. Criteria will use the current live framework; reactivate after reviewing them."
                  : pending.status === "active"
                    ? "Activation requires an active, scoring-ready framework and a complete criterion selection. The framework version will be pinned."
                    : "The template will remain available for reference. Existing snapshots are preserved."}
              </p>
              {error && (
                <p
                  role="alert"
                  className="mt-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              {conflict && (
                <p className="mt-2 text-sm text-red-700">
                  Reload templates before retrying.
                </p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy || conflict}
                  onClick={() => void changeStatus()}
                >
                  {busy ? "Saving..." : "Confirm"}
                </button>
                <button
                  type="button"
                  className={secondaryClass}
                  disabled={busy}
                  onClick={() => back()}
                >
                  {conflict ? "Reload templates" : "Cancel"}
                </button>
              </div>
            </div>
          )}
          <fieldset
            disabled={locked}
            className="mb-5 grid gap-3 lg:grid-cols-3"
          >
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setFilters({ ...filters, search: search.trim(), page: 1 });
              }}
            >
              <div className="flex-1">
                <Field label="Search templates">
                  <input
                    type="search"
                    maxLength={200}
                    className={inputClass}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Name or description"
                  />
                </Field>
              </div>
              <button
                type="submit"
                className={secondaryClass}
              >
                Search
              </button>
            </form>
            <Field label="Status">
              <select
                className={inputClass}
                value={filters.status}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    status: event.target.value,
                    page: 1,
                  })
                }
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Framework">
              <select
                className={inputClass}
                disabled={frameworks.loading || Boolean(frameworks.error)}
                value={filters.frameworkId}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    frameworkId: event.target.value,
                    page: 1,
                  })
                }
              >
                <option value="">All frameworks</option>
                {frameworks.data?.map((framework) => (
                  <option
                    key={framework._id}
                    value={framework._id}
                  >
                    {framework.name} · {framework._id.slice(-6)}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>
          {frameworks.error && (
            <div
              role="alert"
              className="mb-4 text-sm text-red-700"
            >
              Framework filter unavailable: {frameworks.error}{" "}
              <button
                type="button"
                className="underline"
                onClick={frameworks.reload}
              >
                Retry
              </button>
            </div>
          )}
          <TemplatesTable
            key={`${JSON.stringify(filters)}:${version}`}
            filters={filters}
            disabled={locked}
            onView={setView}
            onStatus={request}
            onPage={(page) => setFilters({ ...filters, page })}
          />
        </>
      )}
    </>
  );
}
