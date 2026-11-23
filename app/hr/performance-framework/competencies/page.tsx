import FrameworkCriteriaPage from "@/components/performance-framework/criteria";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ frameworkId?: string | string[]; kind?: string | string[] }>;
}) {
  const { frameworkId, kind } = await searchParams;
  const initialFrameworkId = typeof frameworkId === "string" ? frameworkId : undefined;
  const initialKind = kind === "kpis" ? "kpis" : "competencies";
  return (
    <FrameworkCriteriaPage
      key={`${initialFrameworkId ?? ""}:${initialKind}`}
      initialFrameworkId={initialFrameworkId}
      initialKind={initialKind}
    />
  );
}
