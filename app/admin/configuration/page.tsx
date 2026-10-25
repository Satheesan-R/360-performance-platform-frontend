import type { Metadata } from "next";
import HrShell from "@/components/layout/hr-shell";
import SettingsWorkspace from "@/components/settings/settings-workspace";
export const metadata: Metadata = { title: "Administration | 360 Performance" };
export default function Page() { return <HrShell role="admin"><SettingsWorkspace role="admin" /></HrShell>; }
