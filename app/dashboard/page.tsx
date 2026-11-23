"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardPath } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/protected-route";
import { usePersonalPreferences } from "@/components/settings/personal-preferences-provider";
import { landingPages } from "@/lib/personal-settings";

function DashboardPage() {
  const router = useRouter();
  const { user, preferences, loading } = usePersonalPreferences();

  useEffect(() => {
    if (!user || loading) return;
    const allowed = landingPages[user.role].some(({ href }) => href === preferences.landingPage);
    router.replace(allowed ? preferences.landingPage : getDashboardPath(user.role));
  }, [router, user, preferences, loading]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm font-medium text-slate-500">Opening your dashboard...</p>
    </main>
  );
}
export default function Page() { return <ProtectedRoute><DashboardPage /></ProtectedRoute>; }
