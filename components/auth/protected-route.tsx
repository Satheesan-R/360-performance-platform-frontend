"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getDashboardPath, getToken } from "@/lib/auth";
import type { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  role: UserRole;
  children: ReactNode;
}

function subscribeToBrowserStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(
    subscribeToBrowserStorage,
    () => true,
    () => false,
  );
  const token = isHydrated ? getToken() : null;
  const user = isHydrated ? getCurrentUser() : null;
  const isAuthorized = Boolean(token && user?.role === role);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token || !user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace(getDashboardPath(user.role));
    }
  }, [isHydrated, role, router, token, user]);

  if (!isAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Checking your access...</p>
      </main>
    );
  }

  return children;
}
