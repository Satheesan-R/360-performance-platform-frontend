import type { ReactNode } from "react";
import WorkspaceShell from "@/components/layout/workspace-shell";
import { leadershipWorkspaces, type LeadershipRole } from "./leadership-workspaces";

export default function LeadershipLayout({ children, role }: { children: ReactNode; role: LeadershipRole }) {
  const workspace = leadershipWorkspaces[role];
  const navigation = [
    { label: "Dashboard", href: `${workspace.base}/dashboard`, short: "DB" },
    ...Object.entries(workspace.areas).map(([slug, area]) => ({
      label: area.title,
      href: `${workspace.base}/${slug}`,
      short: area.short,
    })),
  ];

  return (
    <WorkspaceShell
      role={role}
      title={`${workspace.title} workspace`}
      description={role === "department_manager" ? "Department performance and development" : "Technical performance and coaching"}
      initials={workspace.initials}
      navigation={navigation}
    >
      {children}
    </WorkspaceShell>
  );
}
