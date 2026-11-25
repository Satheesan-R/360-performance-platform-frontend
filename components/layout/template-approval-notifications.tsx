"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useOrganizationResource } from "@/hooks/use-organization-resource";
import { getCurrentUser } from "@/lib/auth";
import { getPendingTemplateApprovals, getReviewTemplates } from "@/services/review-template.service";
import type { TemplateList } from "@/types/review-template";

type Role = "admin" | "hr";
const ApprovalContext = createContext<{
  data: TemplateList | null;
  loading: boolean;
  error: string;
  refresh: () => void;
}>({ data: null, loading: true, error: "", refresh: () => {} });

const loadPending = (signal: AbortSignal) => getPendingTemplateApprovals(1, signal);
const loadApproved = (signal: AbortSignal) =>
  getReviewTemplates({ search: "", frameworkId: "", status: "", approvalStatus: "approved", page: 1 }, signal);

export function TemplateApprovalNotificationsProvider({ role, children }: { role: Role; children: ReactNode }) {
  const { data, loading, error, reload } = useOrganizationResource(role === "admin" ? loadPending : loadApproved);

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

  return <ApprovalContext.Provider value={{ data, loading, error, refresh: reload }}>{children}</ApprovalContext.Provider>;
}

export function useApprovalNotifications(onChange: () => void) {
  const { data, refresh } = useContext(ApprovalContext);
  const count = data?.pagination.total;
  const previousCount = useRef(count);

  useEffect(() => {
    if (count === previousCount.current) return;
    previousCount.current = count;
    onChange();
  }, [count, onChange]);

  return refresh;
}

function notificationId(template: TemplateList["templates"][number]) {
  return `${template._id}:${template.approvedAt ?? template.__v ?? ""}`;
}

function readSeen(key: string): string[] {
  try {
    const values: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(values) ? values.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export default function TemplateApprovalNotificationBell({ role }: { role: Role }) {
  const { data, error, loading, refresh } = useContext(ApprovalContext);
  const panelId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const storageKey = `performance-template-approvals-seen:${getCurrentUser()?.id ?? ""}`;
  const [seen, setSeen] = useState(() => role === "hr" ? readSeen(storageKey) : []);
  const templates = data?.templates ?? [];
  const isAdmin = role === "admin";
  const count = isAdmin ? data?.pagination.total ?? 0 : templates.filter((template) => !seen.includes(notificationId(template))).length;
  const href = isAdmin ? "/admin/template-approvals" : "/hr/performance-framework/templates";

  function markRead() {
    const ids = [...new Set([...templates.map(notificationId), ...seen])].slice(0, 100);
    setSeen(ids);
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch {
      // Keep read state available for this session.
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={count ? `Notifications (${count} ${isAdmin ? "pending" : "unread"})` : "Notifications"}
        popoverTarget={panelId}
        className="relative grid size-10 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {count > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-5 rounded-full bg-blue-700 px-1 text-center text-[10px] leading-5 font-semibold text-white">{count > 99 ? "99+" : count}</span>}
      </button>
      <div
        ref={panel}
        id={panelId}
        popover="auto"
        aria-labelledby={`${panelId}-title`}
        className={`fixed inset-auto right-4 m-0 w-80 max-w-[calc(100vw_-_2rem)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-lg sm:right-8 ${isAdmin ? "top-20" : "top-16"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${panelId}-title`} className="text-sm font-bold">Notifications</h2>
          {!isAdmin && count > 0 && <button type="button" className="text-xs font-semibold text-blue-700 hover:underline" onClick={markRead}>Mark all as read</button>}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">Unable to load notifications. <button type="button" className="underline" onClick={refresh}>Retry</button></p>}
        {!data && loading && <p role="status" className="mt-3 text-sm text-slate-600">Loading notifications…</p>}
        {data && !error && (
          templates.length ? (
            <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {templates.map((template) => {
                const unread = !isAdmin && !seen.includes(notificationId(template));
                const date = isAdmin ? template.submittedAt : template.approvedAt;
                return (
                  <li key={template._id} className="py-2 text-sm">
                    <p className={unread ? "font-bold" : "font-medium"}>{template.name}</p>
                    <p className="text-xs text-slate-600">{isAdmin ? "Awaiting admin approval" : "Approved by Admin"}{date ? ` · ${new Date(date).toLocaleDateString()}` : ""}</p>
                  </li>
                );
              })}
            </ul>
          ) : <p className="mt-3 text-sm text-slate-600">{isAdmin ? "No pending approval requests." : "No approved templates yet."}</p>
        )}
        <Link href={href} onClick={() => panel.current?.hidePopover()} className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">
          {isAdmin ? "Open Template Approvals" : "Open Review Templates"}
        </Link>
      </div>
    </>
  );
}
