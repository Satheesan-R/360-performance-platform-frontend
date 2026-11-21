import type { ReactNode } from "react";
import LeadershipLayout from "@/components/dashboard/leadership-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <LeadershipLayout role="tech_lead">{children}</LeadershipLayout>;
}
