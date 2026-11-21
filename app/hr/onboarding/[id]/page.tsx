import EmployeeDetails from "@/components/onboarding/employee-details";

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetails key={id} id={id} />;
}
