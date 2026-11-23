import api from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
export const categoryLabels: Record<string, string> = { LOGIN_PASSWORD: "Login or password issues", ACCESS_PERMISSIONS: "Account access or permissions", PROFILE_INFORMATION: "Incorrect profile information", MFA_SECURITY: "MFA or security issues", OTHER_ACCOUNT: "Other account issues" };
export const queueLabels: Record<string, string> = { IT: "IT Support", HR: "HR Support" };
export interface SupportContext { queues: string[]; canManageAccess: boolean; categories: { id: string; queue: string }[]; reopenDays: number }
export interface SupportTicket {
  id: string; number: string; requesterId: string; category: string; subject: string; description?: string;
  queue: string; assigneeId: string | null; status: string; priority: string; createdAt: string; updatedAt: string; resolvedAt: string | null;
  revision: number; notificationStatus: string; canManage: boolean; canReopen: boolean;
  messages?: { id: string; authorType: string; text: string; createdAt: string }[];
  history?: { action: string; from?: string; to?: string; note?: string; assigneeId?: string; createdAt: string }[];
}
export interface SupportResult { ticket: SupportTicket; notification?: { status: string; message: string }; replayed?: boolean }
export interface TicketPage { tickets: SupportTicket[]; page: number; hasMore: boolean }
export const supportTransitions: Record<string, string[]> = { OPEN: ["IN_PROGRESS", "ESCALATED", "RESOLVED"], IN_PROGRESS: ["WAITING_FOR_USER", "ESCALATED", "RESOLVED"], WAITING_FOR_USER: ["IN_PROGRESS", "ESCALATED", "RESOLVED"], ESCALATED: ["IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED"], REOPENED: ["IN_PROGRESS", "ESCALATED", "RESOLVED"], RESOLVED: ["CLOSED"], CLOSED: [] };
function config() { if (!getCurrentUser() || !getToken()) throw new Error("Sign in to access account support."); return { headers: { Authorization: `Bearer ${getToken()}` } }; }
export const supportService = {
  async context(signal?: AbortSignal) { return (await api.get<SupportContext>("/support/context", { ...config(), signal })).data; },
  async list(scope: string, page: number, queue: string, signal?: AbortSignal) { return (await api.get<TicketPage>("/support/tickets", { ...config(), signal, params: { scope, page, ...(queue ? { queue } : {}) } })).data; },
  async create(body: { category: string; subject: string; description: string; requestId: string }) { return (await api.post<SupportResult>("/support/tickets", body, config())).data; },
  async read(id: string) { return (await api.get<SupportResult>(`/support/tickets/${encodeURIComponent(id)}`, config())).data; },
  async message(id: string, text: string) { return (await api.post<SupportResult>(`/support/tickets/${encodeURIComponent(id)}/messages`, { text }, config())).data; },
  async reopen(id: string, note: string) { return (await api.post<SupportResult>(`/support/tickets/${encodeURIComponent(id)}/reopen`, { note }, config())).data; },
  async status(id: string, status: string, note: string) { return (await api.patch<SupportResult>(`/support/tickets/${encodeURIComponent(id)}/status`, { status, note }, config())).data; },
  async assign(id: string, assigneeId: string | null, priority: string) { return (await api.patch<SupportResult>(`/support/tickets/${encodeURIComponent(id)}/assignment`, { assigneeId, priority }, config())).data; },
  async officers(queue: string, signal?: AbortSignal) { return (await api.get<{ officers: { id: string; email: string }[] }>("/support/officers", { ...config(), signal, params: { queue } })).data; },
  async membership(email: string, queues: string[], active: boolean) { return (await api.put<{ message: string }>("/support/memberships", { email, queues, active }, config())).data; },
};
