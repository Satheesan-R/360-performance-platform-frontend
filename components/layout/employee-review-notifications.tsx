"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getCurrentUser } from "@/lib/auth";
import { getAssignedReviewCycles } from "@/services/review-cycle.service";

const load = (signal: AbortSignal) => getAssignedReviewCycles(1, signal);

function readSeen(key: string): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(stored) ? stored.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function EmployeeReviewNotifications() {
  const { data, error, loading, reload } = useOrganizationResource(load);
  const panelId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const key = `performance-employee-reviews-seen:${getCurrentUser()?.id ?? ""}`;
  const [seen, setSeen] = useState(() => readSeen(key));
  const cycles = data?.cycles ?? [];
  const unread = cycles.filter((cycle) => !seen.includes(cycle._id)).length;

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

  function markRead(ids: string[]) {
    const next = [...new Set([...ids, ...seen])].slice(0, 100);
    setSeen(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Read state is still available while this workspace is open.
    }
  }

  return (
    <>
      <button
        type="button"
        popoverTarget={panelId}
        aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
        className="relative grid size-10 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unread > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-5 rounded-full bg-blue-700 px-1 text-center text-[10px] leading-5 font-semibold text-white">{unread}</span>}
      </button>
      <div
        ref={panel}
        id={panelId}
        popover="auto"
        aria-labelledby={`${panelId}-title`}
        className="fixed inset-auto top-20 right-4 m-0 w-80 max-w-[calc(100vw_-_2rem)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-lg sm:right-8"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${panelId}-title`} className="text-sm font-bold">Notifications</h2>
          {unread > 0 && <button type="button" className="text-xs font-semibold text-blue-700 hover:underline" onClick={() => markRead(cycles.map((cycle) => cycle._id))}>Mark all as read</button>}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">Unable to load review notifications. <button type="button" className="underline" onClick={reload}>Retry</button></p>}
        {!data && loading && <p role="status" className="mt-3 text-sm text-slate-600">Loading notifications…</p>}
        {data && !error && (cycles.length ? (
          <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {cycles.map((cycle) => (
              <li key={cycle._id}>
                <Link
                  href={`/employee/reviews?cycleId=${encodeURIComponent(cycle._id)}`}
                  onClick={() => { markRead([cycle._id]); panel.current?.hidePopover(); }}
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-blue-50"
                >
                  <p className={seen.includes(cycle._id) ? "font-medium" : "font-bold"}>{cycle.name}</p>
                  <p className="text-xs text-slate-600">A review form has been assigned to you.</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-slate-600">No assigned review notifications yet.</p>)}
        <Link href="/employee/reviews" onClick={() => panel.current?.hidePopover()} className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">Open My Reviews</Link>
      </div>
    </>
  );
}
