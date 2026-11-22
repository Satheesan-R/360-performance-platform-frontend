"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ResourceState, secondaryClass } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getCriteriaFramework } from "@/services/framework-criteria.service";
import { getFrameworkScoring } from "@/services/framework-scoring.service";
import { getReviewTemplates } from "@/services/review-template.service";
import { reviewerLabels } from "@/lib/framework-scoring";
import type { TemplateListItem } from "@/types/review-template";
import DetailTable from "./detail-table";

const overviewHref = "/hr/performance-framework";

export default function FrameworkDetail({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => getCriteriaFramework(id, signal), [id]);
  const loadScoring = useCallback((signal: AbortSignal) => getFrameworkScoring(id, signal), [id]);
  const loadTemplates = useCallback(async (signal: AbortSignal) => {
    const templates: TemplateListItem[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const result = await getReviewTemplates({ frameworkId: id, page, search: "", status: "" }, signal);
      templates.push(...result.templates);
      totalPages = result.pagination.totalPages;
      page += 1;
    } while (page <= totalPages);
    return templates;
  }, [id]);
  const framework = useOrganizationResource(load);
  const scoring = useOrganizationResource(loadScoring);
  const templates = useOrganizationResource(loadTemplates);
  const item = framework.data;
  const settings = scoring.data;

  return (
    <div className="space-y-6">
      <Link className={`${secondaryClass} inline-block`} href={overviewHref}>← Back to Framework Overview</Link>
      <h1 className="text-3xl font-bold">{item?.name ?? "Framework Details"}</h1>
      <ResourceState loading={framework.loading} error={framework.error} retry={framework.reload} />
      {item && !framework.loading && !framework.error && (
        <>
          <DetailTable title="Framework details" columns={["Field", "Value"]} rows={[
            ["Description", item.description || "No description"],
            ["Status", item.status],
            ["Employment types", item.applicableEmploymentTypeIds.map((type) => type.name).join(", ") || "None specified"],
            ["Job roles", item.applicableJobRoles.join(", ") || "None specified"],
            ["Total criteria weight", `${item.totalWeight}%`],
          ].map(([field, value]) => ({ id: field, cells: [field, value] }))} />
          <DetailTable title="Competencies" columns={["Name", "Description", "Category", "Weight", "Status"]} rows={item.competencies.map((criterion) => ({
            id: criterion._id,
            cells: [criterion.name, criterion.description || "—", criterion.category, `${criterion.weight}%`, criterion.status],
          }))} />
          <DetailTable title="KPIs" columns={["Name", "Description", "Target", "Period", "Weight", "Status"]} rows={item.kpis.map((criterion) => ({
            id: criterion._id,
            cells: [criterion.name, criterion.description || "—", `${criterion.targetValue} ${criterion.measurementUnit}`, criterion.targetPeriod || "—", `${criterion.weight}%`, criterion.status],
          }))} />
          <DetailTable title="Rating scale" columns={["Rating", "Label"]} rows={(item.ratingScale?.levels ?? []).map((level) => ({ id: String(level.value), cells: [level.value, level.label] }))} />
          <ResourceState loading={scoring.loading} error={scoring.error} retry={scoring.reload} />
          {settings && !scoring.loading && !scoring.error && (
            <DetailTable title="Scoring weights" columns={["Category or reviewer", "Weight"]} rows={[
              ...(settings.categoryWeights ? [
                { id: "technical", cells: ["Technical", `${settings.categoryWeights.technical}%`] },
                { id: "behavioral", cells: ["Behavioral", `${settings.categoryWeights.behavioral}%`] },
              ] : []),
              ...(settings.reviewerWeights ? settings.enabledReviewers.map((role) => ({
                id: role,
                cells: [reviewerLabels[role], `${settings.reviewerWeights?.[role] ?? 0}%`],
              })) : []),
            ]} />
          )}
          <ResourceState loading={templates.loading} error={templates.error} retry={templates.reload} />
          {templates.data && !templates.loading && !templates.error && (
            <DetailTable title="Review templates" columns={["Template", "Description", "Status", "View"]} rows={templates.data.map((template) => ({
              id: template._id,
              cells: [
                template.name, template.description || "—", template.status,
                <Link key="view" className="font-semibold text-blue-700 hover:underline" href={`${overviewHref}/${encodeURIComponent(id)}/templates/${encodeURIComponent(template._id)}`}>
                  View template<span className="sr-only"> {template.name}</span>
                </Link>,
              ],
            }))} />
          )}
        </>
      )}
    </div>
  );
}
