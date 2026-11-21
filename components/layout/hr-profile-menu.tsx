"use client";

import { useEffect, useRef, useState } from "react";
import { getCurrentUser, getToken } from "@/lib/auth";
import { getEmployees } from "@/services/employee.service";

export default function HrProfileMenu({ onLogout }: { onLogout: () => void }) {
  const email = getCurrentUser()?.email;
  const [profileName, setProfileName] = useState("");
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token || !email) return;

    const controller = new AbortController();
    void getEmployees(token, controller.signal).then((employees) => {
      if (controller.signal.aborted) return;
      const profile = employees.find((employee) => employee.workEmail?.trim().toLowerCase() === email.trim().toLowerCase());
      setProfileName(profile?.fullName?.trim() || [profile?.firstName, profile?.lastName].filter(Boolean).join(" "));
    }).catch(() => {
      // The account email remains available if the employee directory cannot load.
    });
    return () => controller.abort();
  }, [email]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (menu.current?.open && event.target instanceof Node && !menu.current.contains(event.target)) {
        menu.current.open = false;
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const initials = profileName.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase() || "HR";

  return (
    <details
      ref={menu}
      className="relative min-w-0"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          menu.current.open = false;
          trigger.current?.focus();
        }
      }}
    >
      <summary ref={trigger} className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 text-right">
          <span className="block max-w-40 truncate text-sm font-bold text-slate-900 sm:max-w-60">{profileName || email || "HR account"}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">HR Manager</span>
        </span>
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{initials}</span>
      </summary>
      <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
        <div className="border-b border-slate-100 px-3 pb-3 pt-2">
          <p className="text-xs text-slate-500">Signed in as</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-800">{email}</p>
        </div>
        <button type="button" onClick={onLogout} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">
          Log out
        </button>
      </div>
    </details>
  );
}
