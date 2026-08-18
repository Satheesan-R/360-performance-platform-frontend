"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api";

export default function ActivationCard({ token }: { token: string | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function continueActivation() {
    if (!token) return;
    setError("");

    try {
      setIsLoading(true);
      const result = await authService.sendOtp({ token });
      const query = new URLSearchParams({ token, email: result.email });
      router.push(`/verify-otp?${query.toString()}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">!</div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Invalid activation link</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This link does not contain an activation token. Use the complete link from your company email.
        </p>
        <Link href="/login" className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">360</div>
      <div className="mt-7 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Account invitation</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Activate your account</h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Welcome to 360 Performance. Continue to verify your company email and create your login password.
        </p>
      </div>

      <div className="mt-7 space-y-3 rounded-2xl bg-slate-50 p-5">
        <div className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
          <p className="pt-1 text-sm text-slate-600">Receive a verification code by email</p>
        </div>
        <div className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
          <p className="pt-1 text-sm text-slate-600">Verify the six-digit OTP</p>
        </div>
        <div className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
          <p className="pt-1 text-sm text-slate-600">Create your secure password</p>
        </div>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={continueActivation}
        disabled={isLoading}
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Sending verification code..." : "Continue"}
      </button>
      <p className="mt-4 text-center text-xs leading-5 text-slate-400">
        The activation link and verification code expire for your security.
      </p>
    </div>
  );
}
