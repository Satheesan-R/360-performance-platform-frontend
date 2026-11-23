import type { Metadata } from "next";
import ProtectedRoute from "@/components/auth/protected-route";
import PersonalSettings from "@/components/settings/personal-settings";
export const metadata: Metadata = { title: "Personal Settings | 360 Performance" };
export default function Page() { return <ProtectedRoute><PersonalSettings /></ProtectedRoute>; }
