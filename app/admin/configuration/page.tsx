import type { Metadata } from "next";
import SettingsWorkspace from "@/components/settings/settings-workspace";
export const metadata: Metadata = { title: "Administration | 360 Performance" };
export default function Page() {
  return <SettingsWorkspace role="admin" />;
}
