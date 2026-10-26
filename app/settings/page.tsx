import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/protected-route";
import PersonalSettings from "@/components/settings/personal-settings";
export const metadata: Metadata = { title: "Personal Settings | 360 Performance" };
export default async function Page({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  return <ProtectedRoute><PersonalSettings initialSection={section === "profile" ? "profile" : section === "account" ? "account" : "general"} /></ProtectedRoute>;
}
