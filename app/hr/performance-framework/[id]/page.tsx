import FrameworkDetail from "@/components/performance-framework/framework-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FrameworkDetail key={id} id={id} />;
}
