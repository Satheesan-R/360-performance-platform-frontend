import { notFound } from "next/navigation";
import CreateCriterion from "@/components/performance-framework/create-criterion";

export default async function Page({
  params,
}: {
  params: Promise<{ frameworkId: string; kind: string }>;
}) {
  const { frameworkId, kind } = await params;
  if (kind !== "competencies" && kind !== "kpis") notFound();

  return <CreateCriterion frameworkId={frameworkId} kind={kind} />;
}
