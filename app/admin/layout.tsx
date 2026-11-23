import type { ReactNode } from "react";
import WorkspaceShell from "@/components/layout/workspace-shell";

const navigation = [
  { label: "Dashboard", href: "/admin/dashboard", short: "DB" },
  { label: "Review Templates", href: "/admin/review-templates", short: "RT" },
  { label: "Template Approvals", href: "/admin/template-approvals", short: "TA" },
  { label: "Organization", href: "/admin/organization", short: "OR" },
  { label: "Employee Directory", href: "/admin/employees", short: "ED" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell
      role="admin"
      title="Admin workspace"
      description="Platform administration"
      initials="AD"
      navigation={navigation}
    >
      {children}
    </WorkspaceShell>
  );
}
