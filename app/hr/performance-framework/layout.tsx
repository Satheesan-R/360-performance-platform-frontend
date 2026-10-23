import type { ReactNode } from "react";
import FrameworkNavigation from "@/components/performance-framework/navigation";

export default function FrameworkLayout({ children }: { children: ReactNode }) {
  return <><FrameworkNavigation />{children}</>;
}
