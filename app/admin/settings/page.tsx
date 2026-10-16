import type { Metadata } from "next";
import HrShell from "@/components/layout/hr-shell";
import SettingsWorkspace from "@/components/settings/settings-workspace";

export const metadata: Metadata = { title: "Admin Settings | 360 Performance" };

export default function AdminSettingsPage() {
  return <HrShell role="admin"><SettingsWorkspace role="admin" /></HrShell>;
}
