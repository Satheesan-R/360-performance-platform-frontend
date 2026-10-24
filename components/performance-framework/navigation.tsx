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
    <div className="mb-8 border-b border-slate-200">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Framework setup
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Build the structure used in your review cycles
          </p>
        </div>
        <span className="whitespace-nowrap text-xs font-medium text-slate-400">
          4 steps
        </span>
      </div>
      <nav
        aria-label="Performance Framework pages"
        className="flex gap-1 overflow-x-auto"
      >
        {frameworkNavigation.map((item, index) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}
              >
                {index + 1}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
