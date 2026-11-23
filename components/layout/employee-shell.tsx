import type { ReactNode } from "react";
import WorkspaceShell from "./workspace-shell";

const navigation = [
  { label: "Dashboard", href: "/employee/dashboard", short: "DB" },
  { label: "My Profile", href: "/employee/profile", short: "MP" },
  { label: "Goals", href: "/employee/goals", short: "GL" },
  { label: "My Reviews", href: "/employee/reviews", short: "RV" },
  { label: "Feedback", href: "/employee/feedback", short: "FB" },
  { label: "Development", href: "/employee/development", short: "DV" },
  { label: "Settings", href: "/settings", short: "ST" },
];

export default function EmployeeShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell
      role="employee"
      title="Employee workspace"
      description="Your performance and growth"
      initials="ME"
      navigation={navigation}
    >
      {children}
    </WorkspaceShell>
  );
}
