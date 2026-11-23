"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const frameworkNavigation = [
  {
    label: "Framework Overview",
    shortLabel: "Overview",
    href: "/hr/performance-framework",
  },
  {
    label: "Competencies & KPIs",
    shortLabel: "Criteria",
    href: "/hr/performance-framework/competencies",
  },
  {
    label: "Rating Scales & Weightages",
    shortLabel: "Scoring",
    href: "/hr/performance-framework/scoring",
  },
  {
    label: "Review Templates",
    shortLabel: "Templates",
    href: "/hr/performance-framework/templates",
  },
];

export default function FrameworkNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Performance Framework pages"
      className="mb-8 grid grid-cols-2 gap-x-2 border-b border-slate-300 sm:flex sm:flex-wrap lg:gap-x-4"
    >
      {frameworkNavigation.map((item, index) => {
        const current = pathname === item.href;
        const active = current || (index > 0 && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : active ? "location" : undefined}
            className={`border-b-2 px-3 py-3 text-center text-sm font-semibold transition sm:px-4 lg:text-base ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-900 hover:border-slate-300 hover:text-blue-700"}`}
          >
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
