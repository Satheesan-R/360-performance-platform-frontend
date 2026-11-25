"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

type ProfileResponse = {
  profile: {
    employee: { firstName?: string; lastName?: string } | null;
  };
};

type DashboardWelcomeProps = {
  title: string;
  description: string;
  fallbackName?: string;
  action?: { href: string; label: string };
};

export default function DashboardWelcome({ title, description, fallbackName, action }: DashboardWelcomeProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const controller = new AbortController();

    async function loadName() {
      try {
        const { data } = await api.get<ProfileResponse>("/settings/profile", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const employee = data.profile.employee;
        if (!controller.signal.aborted) {
          setName([employee?.firstName?.trim(), employee?.lastName?.trim()].filter(Boolean).join(" "));
        }
      } catch {
        // Keep the greeting available when the profile request fails.
      }
    }

    void loadName();
    return () => controller.abort();
  }, []);

  const displayName = name || fallbackName;

  return (
    <header className="flex flex-col items-start gap-6 rounded-2xl bg-linear-to-br from-blue-700 to-blue-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-blue-100">{title}</p>
        <h1 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl">
          {displayName ? `Welcome back, ${displayName}` : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {action.label}
        </Link>
      )}
    </header>
  );
}
