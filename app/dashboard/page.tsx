"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getDashboardPath, getToken } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!getToken() || !user) {
      router.replace("/login");
      return;
    }
    router.replace(getDashboardPath(user.role));
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm font-medium text-slate-500">Opening your dashboard...</p>
    </main>
  );
}
