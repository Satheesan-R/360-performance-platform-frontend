"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import ProtectedRoute from "@/components/auth/protected-route";
import { clearSession } from "@/lib/auth";
import HrProfileMenu from "./hr-profile-menu";
import { frameworkNavigation } from "@/components/performance-framework/navigation";
import type { SettingsRole } from "@/lib/settings-demo";
import { useSettingsOverlay } from "@/components/settings/settings-overlay-provider";

const navigation = [
  { label: "Dashboard", href: "/hr/dashboard", icon: "▦" },
  { label: "Employee Onboarding", href: "/hr/onboarding", icon: "♙" },
  { label: "Organization", href: "/hr/organization", icon: "▥" },
  {
    label: "Performance Framework",
    href: "/hr/performance-framework",
    icon: "▤",
  },
  { label: "Review Cycles", href: "/hr/review-cycles", icon: "⟳" },
  { label: "Normalisation", href: "/hr/normalisation", icon: "⇄" },
  {
    label: "Promotion & Development",
    href: "/hr/promotion-development",
    icon: "↗",
  },
  { label: "Analytics", href: "/hr/analytics", icon: "▂▅▇" },
  { label: "Audit", href: "/hr/audit", icon: "✓" },
];

function SidebarIcon({ icon, active }: { icon: string; active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-lg leading-none ${icon.length > 1 ? "text-xs" : "text-lg"} ${active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
    >
      {icon}
    </span>
  );
}

export default function HrShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const openSettings = useSettingsOverlay();
  const [menuOpen, setMenuOpen] = useState(false);
  const [frameworkExpanded, setFrameworkExpanded] = useState<boolean | null>(
    null,
  );

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <ProtectedRoute role={role}>
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
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white text-slate-700 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-6">
            <div className="flex items-center gap-3">
              <Image src="/images/corpdev360-mark.png" alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
              <div>
                <p className="text-lg font-bold leading-tight text-blue-700">360 Performance</p>
                <p className="text-xs text-slate-500">Human Resources</p>
              </div>
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

          <nav className="flex-1 space-y-1 overflow-hidden px-4 py-6">
            {navigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              if (item.href === "/hr/performance-framework") {
                const open = frameworkExpanded ?? active;
                return (
                  <div key={item.href}>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls="framework-submenu"
                      onClick={() => {
                        setFrameworkExpanded(!open);
                        if (!open && !active) router.push(item.href);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                    >
                      <SidebarIcon icon={item.icon} active={active} />
                      <span className="flex-1">{item.label}</span>
                      <span
                        aria-hidden="true"
                        className={`transition-transform ${organizationOpen ? "rotate-180" : ""}`}
                      >
                        ⌄
                      </span>
                    </button>
                    <div
                      id="framework-submenu"
                      hidden={!open}
                      className="ml-7 mt-2 space-y-1 border-l border-slate-200 pl-3"
                    >
                      {frameworkNavigation.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMenuOpen(false)}
                          aria-current={
                            pathname === child.href ? "page" : undefined
                          }
                          className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${pathname === child.href || (child.href !== "/hr/performance-framework" && pathname.startsWith(child.href + "/")) ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setMenuOpen(false);
                    setFrameworkExpanded(null);
                  }}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                >
                  <SidebarIcon icon={item.icon} active={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8 lg:justify-end">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-lg lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                popoverTarget="hr-notifications"
                className="relative grid size-10 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <span aria-hidden="true" className="relative block h-3.5 w-3 rounded-t-full border-2 border-current before:absolute before:-bottom-0.5 before:-left-1 before:h-0.5 before:w-4 before:rounded-full before:bg-current after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current" />
              </button>
              <div
                id="hr-notifications"
                popover="auto"
                aria-labelledby="hr-notifications-title"
                className="fixed inset-auto top-16 right-4 m-0 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-lg sm:right-8"
              >
                <h2 id="hr-notifications-title" className="text-sm font-bold">Notifications</h2>
                <p className="mt-2 text-sm text-slate-600">In-app notifications are not available yet.</p>
              </div>
              <span aria-hidden="true" className="h-6 w-px shrink-0 bg-slate-200" />
              <HrProfileMenu onLogout={logout} />
            </div>
          </header>

          <div className="px-4 py-5 sm:px-5 sm:py-8 lg:px-12">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
