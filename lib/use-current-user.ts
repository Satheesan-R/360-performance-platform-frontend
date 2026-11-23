"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";
function subscribe(change: () => void) { window.addEventListener("storage", change); window.addEventListener("performance-auth-change", change); return () => { window.removeEventListener("storage", change); window.removeEventListener("performance-auth-change", change); }; }
function snapshot() { try { return JSON.stringify(getCurrentUser()); } catch { return "null"; } }
export function useCurrentUser(): AuthUser | null { const value = useSyncExternalStore(subscribe, snapshot, () => "null"); return useMemo(() => JSON.parse(value) as AuthUser | null, [value]); }
