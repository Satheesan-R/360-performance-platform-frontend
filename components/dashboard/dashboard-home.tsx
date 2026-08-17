"use client";

import { useRouter } from "next/navigation";
import { clearSession, getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/types/auth";

const roleLabels: Record<UserRole, string> = {
  employee: "Employee",
  tech_lead: "Tech Lead",
  department_manager: "Department Manager",
  hr: "HR",
  admin: "Admin",
};

export default function DashboardHome({ role }: { role: UserRole }) {
  const router = useRouter();
  const user = getCurrentUser();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-blue-600">360 Performance</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{roleLabels[role]} Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Log out
          </button>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="mt-1 font-semibold text-slate-900">{user?.email}</p>
          <h2 className="mt-8 text-xl font-bold text-slate-900">Welcome to your dashboard</h2>
          <p className="mt-2 text-slate-600">
            Your role-based dashboard is protected and ready for its feature modules.
          </p>
        </section>
      </div>
    </main>
  );
}
