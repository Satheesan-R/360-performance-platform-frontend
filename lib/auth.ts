import type { AuthUser, LoginResponse } from "@/types/auth";

const TOKEN_KEY = "performance_platform_token";
const USER_KEY = "performance_platform_user";

const DASHBOARD_PATHS: Record<AuthUser["role"], string> = {
  employee: "/employee/dashboard",
  tech_lead: "/tech-lead/dashboard",
  department_manager: "/manager/dashboard",
  hr: "/hr/dashboard",
  admin: "/admin/dashboard",
};

export function saveSession(data: LoginResponse) {
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    clearSession();
    return null;
  }
}

export function getDashboardPath(role: AuthUser["role"]) {
  return DASHBOARD_PATHS[role];
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
