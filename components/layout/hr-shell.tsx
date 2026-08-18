"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import ProtectedRoute from "@/components/auth/protected-route";
import { clearSession, getCurrentUser } from "@/lib/auth";

const navigation = [
  { label: "Dashboard", href: "/hr/dashboard", short: "DB" },
  { label: "Employee Onboarding", href: "/hr/onboarding", short: "EO" },
  { label: "Review Cycles", href: "/hr/review-cycles", short: "RC" },
  { label: "Normalisation", href: "/hr/normalisation", short: "NM" },
  { label: "Promotion & Development", href: "/hr/promotion-development", short: "PD" },
  { label: "Analytics", href: "/hr/analytics", short: "AN" },
  { label: "Audit", href: "/hr/audit", short: "AU" },
];

export default function HrShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = getCurrentUser();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <ProtectedRoute role="hr">
      <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
        {menuOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
            <div>
              <p className="text-lg font-bold">360 Performance</p>
              <p className="text-xs text-slate-400">Human Resources</p>
            </div>
            <button type="button" className="text-2xl text-slate-400 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              ×
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold ${active ? "bg-white/15" : "bg-white/5"}`}>
                    {item.short}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 rounded-xl bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">Signed in as HR</p>
              <p className="mt-1 truncate text-sm font-medium">{user?.email}</p>
            </div>
            <button type="button" onClick={logout} className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setMenuOpen(true)} className="rounded-lg border border-slate-200 px-3 py-2 text-lg lg:hidden" aria-label="Open menu">
                ☰
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">HR workspace</p>
                <p className="text-sm text-slate-500">Manage people and performance</p>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">HR</div>
          </header>

          <div className="p-5 sm:p-8">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
