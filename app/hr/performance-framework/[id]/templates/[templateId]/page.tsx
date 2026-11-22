import TemplateDetail from "@/components/performance-framework/template-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; templateId: string }>;
}) {
  const { id, templateId } = await params;
  return <TemplateDetail key={templateId} frameworkId={id} templateId={templateId} />;
}
