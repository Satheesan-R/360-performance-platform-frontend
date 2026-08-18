"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api";
import { clearPasswordSetupToken, getPasswordSetupToken } from "@/lib/activation";

const requirements = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
];

export default function CreatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passedRequirements = requirements.filter((requirement) => requirement.test(password)).length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const setupToken = getPasswordSetupToken();
    if (!setupToken) {
      setError("Your password setup session is missing or expired. Start again from the activation email.");
      return;
    }
    if (passedRequirements !== requirements.length) {
      setError("Your password does not meet all requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.createPassword({ setupToken, password });
      clearPasswordSetupToken();
      router.replace("/account-success");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">360</div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Final step</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Use this password with your company email when signing in.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">New password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Create a strong password"
            />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-blue-600">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-3 flex gap-2">
            {requirements.map((_, index) => (
              <span key={index} className={`h-1.5 flex-1 rounded-full ${index < passedRequirements ? "bg-blue-600" : "bg-slate-200"}`} />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {requirements.map((requirement) => {
              const passed = requirement.test(password);
              return <p key={requirement.label} className={`text-xs ${passed ? "font-medium text-emerald-600" : "text-slate-500"}`}>{passed ? "✓" : "○"} {requirement.label}</p>;
            })}
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Enter the password again"
          />
          {confirmPassword && password !== confirmPassword && <p className="mt-1.5 text-xs font-medium text-red-600">Passwords do not match</p>}
        </div>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-400">Need a new verification code? <Link href="/login" className="font-semibold text-blue-600">Return to login</Link></p>
    </div>
  );
}
