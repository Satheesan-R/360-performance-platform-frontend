"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const frameworkNavigation = [
  { label: "Framework Overview", href: "/hr/performance-framework" },
  { label: "Competencies & KPIs", href: "/hr/performance-framework/competencies" },
  { label: "Rating Scales & Weightages", href: "/hr/performance-framework/scoring" },
  { label: "Review Templates", href: "/hr/performance-framework/templates" },
];

export default function FrameworkNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Performance Framework pages" className="mb-8 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
    {frameworkNavigation.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-white"}`}>{item.label}</Link>)}
  </nav>;
}
