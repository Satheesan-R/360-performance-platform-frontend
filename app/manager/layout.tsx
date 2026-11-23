import type { ReactNode } from "react";
import LeadershipLayout from "@/components/dashboard/leadership-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <LeadershipLayout role="department_manager">{children}</LeadershipLayout>;
}
