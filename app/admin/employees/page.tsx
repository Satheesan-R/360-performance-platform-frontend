import AdminEmployees from "@/components/dashboard/admin-employees";
import AdminPageHeading from "@/components/dashboard/admin-page-heading";

export default function AdminEmployeesPage() {
  return (
    <main className="mx-auto max-w-7xl">
      <AdminPageHeading title="Employee Directory" description="Find employee records and check account onboarding." />
      <AdminEmployees />
    </main>
  );
}
