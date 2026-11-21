"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import {
  getOrganization,
  getOrganizationSummary,
  updateOrganization,
} from "@/services/organization.service";
import { getApiErrorMessage } from "@/lib/api";
import type { Organization } from "@/types/organization";
import {
  buttonClass,
  secondaryClass,
  inputClass,
  Field,
  Status,
  ResourceState,
} from "./ui";

const summaryCards = [
  { label: "Total employees", key: "totalEmployees", icon: "♙" },
  { label: "Departments", key: "departments", icon: "▥", href: "/hr/organization/departments", linkLabel: "View departments" },
  { label: "Teams", key: "teams", icon: "▱", href: "/hr/organization/teams", linkLabel: "View teams" },
] as const;

export default function OrganizationOverview({ showStructureLinks = false }: { showStructureLinks?: boolean }) {
  const details = useOrganizationResource(getOrganization);
  const summary = useOrganizationResource(getOrganizationSummary);
  const [draft, setDraft] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { _id, ...values } = draft;
      void _id;
      await updateOrganization(values);
      setDraft(null);
      setSuccess("Organization details updated.");
      await Promise.all([details.reload(), summary.reload()]);
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }
  const organization = details.data;
  const organizationName = organization?.name?.trim() || "Organization";
  const counts = summary.data;
  return (
    <>
      <header className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          {organization?.logoUrl ? (
            <Image unoptimized src={organization.logoUrl} alt="" width={72} height={72} className="size-16 shrink-0 rounded-xl object-contain sm:size-18" />
          ) : (
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-xl bg-blue-100 text-2xl font-bold text-blue-700 sm:size-18">
              {organizationName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="wrap-break-word text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{organizationName}</h1>
            {organization && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
                <span>{organization.code}</span>
                <span aria-hidden="true" className="h-4 w-px bg-slate-300" />
                <Status value={organization.status} />
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          className={`${buttonClass} mt-4 shrink-0 sm:mt-0`}
          disabled={!organization || details.loading || Boolean(details.error) || Boolean(draft)}
          onClick={() => {
            setDraft(organization);
            setError("");
            setSuccess("");
          }}
        >
          Edit organization
        </button>
      </header>
      <section
        aria-label="Organization summary"
        className="mb-7"
      >
        <ResourceState
          loading={summary.loading}
          error={summary.error}
          retry={summary.reload}
        />

        {!summary.loading && !summary.error && counts && (
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {summaryCards.map((card) => (
              <div
                key={card.key}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <span aria-hidden="true" className="block text-2xl leading-none text-blue-800">{card.icon}</span>
                <dl className="mt-4 flex flex-col">
                  <dt className="order-2 mt-1 text-sm font-medium text-slate-600">{card.label}</dt>
                  <dd className="text-3xl font-bold leading-none tracking-tight tabular-nums text-slate-950">{counts[card.key].toLocaleString()}</dd>
                </dl>
                {showStructureLinks && "href" in card && (
                  <Link href={card.href} className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">{card.linkLabel}</Link>
                )}
              </div>
            ))}
          </div>
        )}
        {showStructureLinks && (
          <Link href="/hr/organization/hierarchy" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
            View reporting hierarchy <span aria-hidden="true">→</span>
          </Link>
        )}
      </section>

      {success && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <ResourceState
        loading={details.loading}
        error={details.error}
        retry={details.reload}
      />
      {!details.loading &&
        !details.error &&
        organization &&
        (draft ? (
          <form
            onSubmit={save}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <h2 className="mb-5 text-lg font-bold tracking-tight text-slate-950">
              Edit organization
            </h2>
            <fieldset
              disabled={saving}
              className="grid gap-4 sm:grid-cols-2 sm:gap-5"
            >
              {(
                [
                  { key: "name", label: "Organization name", required: true },
                  { key: "code", label: "Organization code", required: true },
                  { key: "industry", label: "Industry" },
                  {
                    key: "contactEmail",
                    label: "Contact email",
                    type: "email",
                    required: true,
                  },
                  { key: "country", label: "Country", required: true },
                  {
                    key: "timezone",
                    label: "Timezone (e.g. Asia/Colombo)",
                    required: true,
                  },
                  { key: "logoUrl", label: "Logo URL", type: "url" },
                ] as const
              ).map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                >
                  <input
                    className={inputClass}
                    type={"type" in field ? field.type : "text"}
                    required={"required" in field && field.required}
                    value={draft[field.key] ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, [field.key]: event.target.value })
                    }
                  />
                </Field>
              ))}
              <Field label="Status">
                <select
                  className={inputClass}
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      status: event.target.value as Organization["status"],
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                  />
                </Field>
              </div>
            </fieldset>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                className={`${secondaryClass} w-full sm:w-auto`}
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${buttonClass} w-full sm:w-auto`}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <section aria-labelledby="company-details" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h2 id="company-details" className="border-b border-slate-200 px-5 py-4 text-lg font-bold text-slate-950 sm:px-6">
              Company details
            </h2>
            <dl className="grid gap-px bg-slate-200 sm:grid-cols-2">
              {[
                ["Industry", organization.industry],
                ["Contact email", organization.contactEmail],
                ["Country", organization.country],
                ["Time zone", organization.timezone],
                ["Description", organization.description],
              ].map(([label, value]) => (
                <div key={label} className={`min-w-0 bg-white px-5 py-3 sm:px-6 ${label === "Description" ? "sm:col-span-2" : ""}`}>
                  <dt className="text-sm font-semibold text-slate-600">{label}</dt>
                  <dd className="mt-1 whitespace-pre-wrap wrap-break-word text-sm text-slate-900">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
    </>
  );
}
