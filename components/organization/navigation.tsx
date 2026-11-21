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
  return (
    <nav
      aria-label="Organization pages"
      className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-300 sm:gap-3"
    >
      {organizationNavigation.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/hr/organization" &&
            pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 sm:px-4 ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-800 hover:border-blue-200 hover:text-blue-700"}`}
          >
            {item.href === "/hr/organization" ? "Overview" : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
