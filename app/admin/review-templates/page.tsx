import AdminTemplates from "@/components/dashboard/admin-templates";
import AdminPageHeading from "@/components/dashboard/admin-page-heading";

export default function AdminTemplatesPage() {
  return (
    <main className="mx-auto max-w-7xl">
      <AdminPageHeading title="Review Templates" description="Browse the templates and frameworks used in performance reviews." />
      <AdminTemplates />
    </main>
  );
}
