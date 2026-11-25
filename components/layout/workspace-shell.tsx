"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import ProtectedRoute from "@/components/auth/protected-route";
import type { UserRole } from "@/types/auth";
import { clearSession, getCurrentUser } from "@/lib/auth";
import EmployeeReviewNotifications from "./employee-review-notifications";
import TemplateApprovalNotificationBell, { TemplateApprovalNotificationsProvider } from "./template-approval-notifications";

type WorkspaceNavigationItem = { label: string; href: string; short: string };

export default function WorkspaceShell({
  children,
  role,
  title,
  description,
  initials,
  navigation,
}: {
  children: ReactNode;
  role: UserRole;
  title: string;
  description: string;
  initials: string;
  navigation: WorkspaceNavigationItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = getCurrentUser();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  const workspace = (
      <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
        {menuOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white text-slate-700 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible"}`}
        >
          <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
            <div>
              <p className="text-lg font-bold text-blue-700">360 Performance</p>
              <p className="text-xs text-slate-500">{title}</p>
            </div>
            <button
              type="button"
              className="text-2xl text-slate-500 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <nav aria-label={title} id="workspace-navigation" className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {navigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold ${active ? "bg-blue-100" : "bg-slate-100"}`}
                  >
                    {item.short}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 rounded-xl bg-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="mt-1 truncate text-sm font-medium">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-lg lg:hidden"
                aria-label="Open menu" aria-expanded={menuOpen} aria-controls="workspace-navigation"
              >
                ☰
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  {title}
                </p>
                <p className="text-sm text-slate-500">
                  {description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {role === "employee" && <EmployeeReviewNotifications />}
              {role === "admin" && <TemplateApprovalNotificationBell role="admin" />}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {initials}
              </div>
            </div>
          </header>
          <div className={role === "employee" ? "px-4 py-5 sm:px-5 sm:py-8 lg:px-6" : "p-5 sm:p-8"}>{children}</div>
        </div>
      </div>
  );
  return (
    <ProtectedRoute role={role}>
      {role === "admin" ? <TemplateApprovalNotificationsProvider role="admin">{workspace}</TemplateApprovalNotificationsProvider> : workspace}
    </ProtectedRoute>
  );
}
