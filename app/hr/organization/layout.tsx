import type { ReactNode } from "react";
import OrganizationNavigation from "@/components/organization/navigation";

export default function OrganizationLayout({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-7xl"><OrganizationNavigation />{children}</main>;
}
