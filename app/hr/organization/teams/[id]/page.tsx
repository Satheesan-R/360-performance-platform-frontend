import TeamDetail from "@/components/organization/team-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeamDetail id={id} />;
}
