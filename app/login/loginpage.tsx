"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api";
import { saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your company email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      saveSession(result);
      router.replace(result.redirectTo);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden bg-blue-700 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-xl font-bold tracking-tight">360 Performance</p>
        <div className="max-w-lg">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Grow together
          </p>
          <h1 className="text-5xl font-bold leading-tight">
            Build stronger teams through meaningful performance.
          </h1>
          <p className="mt-6 text-lg leading-8 text-blue-100">
            Manage onboarding, reviews, development, and employee growth in one place.
          </p>
        </div>
        <p className="text-sm text-blue-200">Secure access for every role in your organization.</p>
      </section>

      <section aria-labelledby="login-heading" className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 sm:py-14 lg:px-12 xl:px-20">
        <div className="w-full max-w-xl">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-500 transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:mb-12">
            <span aria-hidden="true">←</span> Back to home
          </Link>
          <div className="mb-8 lg:hidden">
            <p className="text-xl font-bold text-blue-700">360 Performance</p>
          </div>

          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-bold tracking-[0.14em] text-blue-700">WELCOME BACK</p>
          <h2 id="login-heading" className="mt-5 max-w-lg text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">Sign in to your account</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
            Your team, your goals, your next step forward. Use your company email and password to continue.
          </p>

          <form className="mt-9 space-y-6 sm:mt-10" onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
            <div>
              <label htmlFor="email" className="mb-2.5 block text-base font-semibold text-slate-700">
                Company email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="min-h-14 w-full rounded-xl border border-slate-300 bg-slate-50/60 px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:min-h-16"
              />
            </div>

            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <label htmlFor="password" className="text-base font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="min-h-14 w-full rounded-xl border border-slate-300 bg-slate-50/60 px-5 py-4 pr-20 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:min-h-16"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 rounded-r-xl px-5 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-16 sm:text-lg"
            >
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && <span aria-hidden="true">→</span>}
            </button>
          </form>
          <div className="mt-8 border-t border-slate-200 pt-6 sm:mt-10">
            <p className="text-sm font-semibold text-slate-700">Signing in for the first time?</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Set up your account using the activation link sent to your company email. If you need help accessing your account, contact your HR team.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
