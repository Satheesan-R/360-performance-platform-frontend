import type { Metadata } from "next";
import SettingsWorkspace from "@/components/settings/settings-workspace";

export const metadata: Metadata = { title: "Settings | 360 Performance" };

export default function HrSettingsPage() {
  return <SettingsWorkspace role="hr" />;
}
