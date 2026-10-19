"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const organizationNavigation = [
  { label: "Organization Overview", href: "/hr/organization" },
  { label: "Departments", href: "/hr/organization/departments" },
  { label: "Teams", href: "/hr/organization/teams" },
  { label: "Employment Types", href: "/hr/organization/employment-types" },
  { label: "Reporting Hierarchy", href: "/hr/organization/hierarchy" },
];

export default function OrganizationNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Organization pages" className="mb-8 flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
    {organizationNavigation.map((item) => {
      const active = pathname === item.href;
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>{item.label}</Link>;
    })}
  </nav>;
}
