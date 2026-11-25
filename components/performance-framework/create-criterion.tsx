"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { secondaryClass } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getCriteriaFramework, saveCriterion } from "@/services/framework-criteria.service";
import type { CompetencyInput, CriteriaKind, KpiInput } from "@/types/framework-criteria";
import CriteriaLoadState from "./criteria-load-state";
import CriterionForm from "./criterion-form";

export default function CreateCriterion({ frameworkId, kind }: { frameworkId: string; kind: CriteriaKind }) {
  const router = useRouter();
  const load = useCallback((signal: AbortSignal) => getCriteriaFramework(frameworkId, signal), [frameworkId]);
  const { data: framework, loading, error, reload } = useOrganizationResource(load);
  const backHref = `/hr/performance-framework/competencies?${new URLSearchParams({ frameworkId, kind })}`;
  const title = kind === "competencies" ? "Add Competency" : "Add KPI";

  function back() {
    router.replace(backHref);
  }

  async function save(values: CompetencyInput | KpiInput) {
    if ("category" in values) await saveCriterion(frameworkId, "competencies", values);
    else await saveCriterion(frameworkId, "kpis", values);
    back();
  }

  return (
    <>
      <Link href={backHref} className={`${secondaryClass} mb-5 inline-block`}>← Back to Competencies &amp; KPIs</Link>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {framework && <p className="mb-5 mt-2 text-sm text-slate-600">{framework.name}</p>}
      <CriteriaLoadState loading={loading} error={error} retry={reload} />
      {framework && !loading && !error && (
        framework.status === "archived" || framework[kind].length >= 100 ? (
          <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            {framework.status === "archived"
              ? "Move this framework to draft before adding criteria."
              : "This framework has reached the 100-item limit for this criterion type."}
          </p>
        ) : (
          <CriterionForm kind={kind} item={null} disabled={false} onSave={save} onCancel={back} />
        )
      )}
    </>
  );
}
