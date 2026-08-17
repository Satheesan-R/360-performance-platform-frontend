import type { ReactNode } from "react";
import HrShell from "@/components/layout/hr-shell";

export default function HrLayout({ children }: { children: ReactNode }) {
  return <HrShell>{children}</HrShell>;
}
