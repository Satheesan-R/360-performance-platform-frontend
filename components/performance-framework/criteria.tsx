"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getCriteriaFrameworks } from "@/services/framework-criteria.service";
import { Field, inputClass, PageHeading, secondaryClass } from "@/components/organization/ui";

export function CriteriaLoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p role="status" className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading framework criteria...</p>;
  if (error) return <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700"><p>{error}</p><button type="button" onClick={retry} className={`${secondaryClass} mt-3`}>Try again</button></div>;
  return null;
}

export default function FrameworkCriteriaPage() {
  const frameworks = useOrganizationResource(getCriteriaFrameworks);
  const [selectedId, setSelectedId] = useState("");
  const id = selectedId || frameworks.data?.[0]?._id || "";
  return <>
    <PageHeading title="Competencies & KPIs" description="Competencies measure demonstrated skills and behaviors. KPIs measure achieved results." />
    <CriteriaLoadState loading={frameworks.loading} error={frameworks.error} retry={frameworks.reload} />
    {!frameworks.loading && !frameworks.error && frameworks.data && (frameworks.data.length ? <>
      <div className="mb-6 max-w-xl"><Field label="Framework"><select className={inputClass} value={id} onChange={(event) => setSelectedId(event.target.value)}>{frameworks.data.map((framework) => <option key={framework._id} value={framework._id}>{framework.name} — {framework.status} · {framework._id.slice(-6)}</option>)}</select></Field></div>
      <p className="text-sm text-slate-500">Choose a framework to configure its competencies and KPIs.</p>
    </> : <div className="rounded-2xl border border-slate-200 bg-white p-8"><h2 className="text-lg font-semibold">Create a framework first</h2><p className="mb-6 mt-2 text-sm text-slate-500">Criteria belong to a performance framework.</p><Link href="/hr/performance-framework" className={secondaryClass}>Go to Framework Overview</Link></div>)}
  </>;
}
