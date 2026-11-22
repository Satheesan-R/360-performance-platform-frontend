"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ResourceState, secondaryClass } from "@/components/organization/ui";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getReviewTemplate, getTemplatePreview } from "@/services/review-template.service";
import DetailTable from "./detail-table";

export default function TemplateDetail({
  frameworkId,
  templateId,
}: {
  frameworkId: string;
  templateId: string;
}) {
  const load = useCallback((signal: AbortSignal) => getReviewTemplate(templateId, signal), [templateId]);
  const loadPreview = useCallback((signal: AbortSignal) => getTemplatePreview(templateId, signal), [templateId]);
  const template = useOrganizationResource(load);
  const preview = useOrganizationResource(loadPreview);
  const item = template.data;

  return (
    <div className="space-y-6">
      <Link className={`${secondaryClass} inline-block`} href={`/hr/performance-framework/${encodeURIComponent(frameworkId)}`}>
        ← Back to Framework Details
      </Link>
      <h1 className="text-3xl font-bold">{item?.name ?? "Review Template Details"}</h1>
      <ResourceState loading={template.loading} error={template.error} retry={template.reload} />
      {item && !template.loading && !template.error && (
        <>
          <DetailTable title="Template details" columns={["Field", "Value"]} rows={[
            ["Description", item.description || "No description"],
            ["Status", item.status],
            ["Review type", item.reviewType ?? "Not configured"],
            ["Target role", item.targetRole === "department_manager" ? "Department Manager" : "Not configured"],
            ["Departments", item.departmentIds?.join(", ") || "No department restriction"],
            ["Employment types", item.employmentTypeIds.join(", ") || "Inherit from framework"],
            ["Evidence required", item.evidenceRequired ? "Yes" : "No"],
            ["Framework version", String(item.frameworkVersion ?? "Current")],
          ].map(([field, value]) => ({ id: field, cells: [field, value] }))} />
          <ResourceState loading={preview.loading} error={preview.error} retry={preview.reload} />
          <DetailTable title="Template sections" columns={["Section", "Competencies", "KPIs", "Questions", "Requirements"]} rows={item.sections.map((section, index) => {
            const resolved = preview.data?.sections.find((entry) => section._id && entry._id === section._id)
              ?? preview.data?.sections[index];
            return {
              id: section._id ?? String(index),
              cells: [
                section.title,
                (resolved?.competencies.map((entry) => "missing" in entry ? `Missing competency (${entry._id})` : entry.name) ?? section.competencyIds).join("\n") || "—",
                (resolved?.kpis.map((entry) => "missing" in entry ? `Missing KPI (${entry._id})` : entry.name) ?? section.kpiIds).join("\n") || "—",
                section.questions.map((question) => `${question.prompt} (${question.required ? "required" : "optional"})`).join("\n") || "—",
                [
                  section.required ? "Required section" : "Optional section",
                  section.commentsRequired ? "Comments required" : section.allowComments ? "Comments optional" : "Comments disabled",
                  section.evidenceRequired || item.evidenceRequired ? "Evidence required" : "Evidence optional",
                ].join("\n"),
              ],
            };
          })} />
        </>
      )}
    </div>
  );
}
