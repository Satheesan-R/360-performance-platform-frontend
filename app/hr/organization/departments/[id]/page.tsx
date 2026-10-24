import DepartmentDetail from "@/components/organization/department-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DepartmentDetail id={id} />;
}
