"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getCriteriaFrameworks } from "@/services/framework-criteria.service";
import {
  Field,
  inputClass,
  PageHeading,
  secondaryClass,
} from "@/components/organization/ui";
import CriteriaWorkspace from "./criteria-workspace";
import CriteriaLoadState from "./criteria-load-state";

export default function FrameworkCriteriaPage() {
  const frameworks = useOrganizationResource(getCriteriaFrameworks);
  const [selectedId, setSelectedId] = useState("");
  const [locked, setLocked] = useState(false);
  const id = selectedId || frameworks.data?.[0]?._id || "";
  return (
    <>
      <PageHeading
        title="Competencies & KPIs"
        description="Competencies measure demonstrated skills and behaviors. KPIs measure achieved results."
      />
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
                  disabled={locked}
                  className={inputClass}
                  value={id}
                  onChange={(event) => setSelectedId(event.target.value)}
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
            <CriteriaWorkspace
              key={id}
              frameworkId={id}
              onLock={setLocked}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-lg font-semibold">Create a framework first</h2>
            <p className="mb-6 mt-2 text-sm text-slate-500">
              Criteria belong to a performance framework.
            </p>
            <Link
              href="/hr/performance-framework"
              className={secondaryClass}
            >
              Go to Framework Overview
            </Link>
          </div>
        ))}
    </>
  );
}
