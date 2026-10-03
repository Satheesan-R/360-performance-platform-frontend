import axios, { AxiosError } from "axios";
import { clearSession } from "@/lib/auth";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

const api = axios.create({
  baseURL: apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url === "/auth/login";
    if (error.response?.status === 401 && !isLoginRequest && typeof window !== "undefined") {
      clearSession();

    }
    return Promise.reject(error);
  },
);
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? "Unable to connect to the server";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

export default api;
