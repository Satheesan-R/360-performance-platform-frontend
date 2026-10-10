"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const organizationNavigation = [
  { label: "Organization Overview", href: "/hr/organization" },
  { label: "Departments", href: "/hr/organization/departments" },
  { label: "Teams", href: "/hr/organization/teams" },
  { label: "Employment Types", href: "/hr/organization/employment-types" },
  { label: "Reporting Hierarchy", href: "/hr/organization/hierarchy" },
  { label: "Roles & Permissions", href: "/hr/organization/roles" },
];

export default function OrganizationNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Organization pages" className="mb-8 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">{organizationNavigation.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-white"}`}>{item.label}</Link>)}</nav>;
}
