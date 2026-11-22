"use client";

import { useEffect, useState } from "react";
import { Field, inputClass } from "@/components/organization/ui";
import { getApiErrorMessage } from "@/lib/api";
import { getReviewTemplates } from "@/services/review-template.service";
import type { TemplateList } from "@/types/review-template";

export default function AdminTemplates() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [request, setRequest] = useState(0);
  const [data, setData] = useState<TemplateList | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const result = await getReviewTemplates(
          { search: "", status, frameworkId: "", page },
          controller.signal,
        );
        if (!controller.signal.aborted) setData(result);
      } catch (cause) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(cause));
      }
    }

    void load();
    return () => controller.abort();
  }, [page, request, status]);

  function changePage(nextPage: number) {
    setData(null);
    setPage(nextPage);
  }

  return (
    <section aria-labelledby="admin-review-templates" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="admin-review-templates" className="text-lg font-bold text-slate-900">Template catalog</h2>
        <Field label="Status">
          <select
            className={inputClass}
            value={status}
            onChange={(event) => {
              setError("");
              changePage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>
      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p role="alert">Could not load review templates. {error}</p>
          <button type="button" className="mt-2 font-semibold underline" onClick={() => {
            setError("");
            setRequest((value) => value + 1);
          }}>
            Try again
          </button>
        </div>
      ) : !data ? (
        <p role="status" className="mt-4 text-sm text-slate-600">Loading review templates…</p>
      ) : data.templates.length === 0 ? (
        <div className="mt-4 text-sm text-slate-600">
          <p>{page > 1 ? "No review templates on this page." : status ? "No templates match this status." : "No review templates are available yet."}</p>
          {page > 1 && (
            <button type="button" className="mt-2 font-semibold text-blue-700 hover:underline" onClick={() => changePage(1)}>
              Return to first page
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-600">{data.pagination.total.toLocaleString()} {data.pagination.total === 1 ? "template" : "templates"}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">Template</th>
                  <th scope="col" className="px-3 py-3 font-medium">Framework</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.templates.map((template) => (
                  <tr key={template._id}>
                    <th scope="row" className="px-3 py-3 font-semibold text-slate-800">{template.name}</th>
                    <td className="px-3 py-3 text-slate-600">{template.frameworkId?.name ?? "Unavailable"}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">{template.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pagination.totalPages > 1 && (
            <nav aria-label="Review template pages" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:text-slate-500" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
              <span className="text-slate-600">Page {page} of {data.pagination.totalPages}</span>
              <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:text-slate-500" disabled={page >= data.pagination.totalPages} onClick={() => changePage(page + 1)}>Next</button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
