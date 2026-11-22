"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import ProtectedRoute from "@/components/auth/protected-route";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { getPendingTemplateApprovals } from "@/services/review-template.service";

const ApprovalContext = createContext({
  pendingCount: null as number | null,
  refresh: () => {},
});
const approvalsPath = "/admin/template-approvals";
const loadCount = (signal: AbortSignal) =>
  getPendingTemplateApprovals(1, signal).then((result) => result.pagination.total);

export function useApprovalNotifications(onChange: () => void) {
  const { pendingCount, refresh } = useContext(ApprovalContext);
  const previousCount = useRef(pendingCount);

  useEffect(() => {
    if (pendingCount === previousCount.current) return;
    previousCount.current = pendingCount;
    onChange();
  }, [pendingCount, onChange]);

  return refresh;
}

function Workspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: pendingCount, error, reload } = useOrganizationResource(loadCount);

  useEffect(() => {
    function refreshVisible() {
      if (document.visibilityState === "visible") void reload();
    }
    const timer = window.setInterval(refreshVisible, 30_000);
    document.addEventListener("visibilitychange", refreshVisible);
    window.addEventListener("focus", refreshVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshVisible);
      window.removeEventListener("focus", refreshVisible);
    };
  }, [reload]);

  return (
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
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${menuOpen ? "translate-x-0" : "invisible -translate-x-full lg:visible"}`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div>
            <p className="text-lg font-bold">360 Performance</p>
            <p className="text-xs text-slate-600">Administration</p>
          </div>
          <button type="button" aria-label="Close menu" className="text-2xl text-slate-600 lg:hidden" onClick={() => setMenuOpen(false)}>
            ×
          </button>
        </div>
        <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {[
            { href: "/admin/dashboard", label: "Dashboard", short: "DB" },
            { href: approvalsPath, label: "Template Approvals", short: "TA" },
          ].map(({ href, label, short }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${pathname === href ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}
            >
              <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${pathname === href ? "bg-white/15" : "bg-slate-100"}`}>
                {short}
              </span>
              <span className="flex-1">{label}</span>
              {href === approvalsPath && !error && pendingCount !== null && pendingCount > 0 && (
                <span aria-label={`${pendingCount} pending requests`} className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-600">Signed in as Admin</p>
            <p className="mt-1 truncate text-sm font-medium">{getCurrentUser()?.email}</p>
          </div>
          <button
            type="button"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
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
              aria-label="Open menu"
              aria-controls="admin-sidebar"
              aria-expanded={menuOpen}
              className="rounded-lg border border-slate-200 px-3 py-2 text-lg lg:hidden"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Admin workspace</p>
              <p className="text-sm text-slate-500">Manage template approvals</p>
            </div>
          </div>
          <div aria-label="Admin" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            AD
          </div>
        </header>
        <main className="p-5 sm:p-8">
          <ApprovalContext.Provider value={{ pendingCount, refresh: reload }}>{children}</ApprovalContext.Provider>
        </main>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return <ProtectedRoute role="admin"><Workspace>{children}</Workspace></ProtectedRoute>;
}
