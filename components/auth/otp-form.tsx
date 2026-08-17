"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api";
import { savePasswordSetupToken } from "@/lib/activation";

const OTP_LENGTH = 6;

export default function OtpForm({ token, email }: { token: string | null; email?: string }) {
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(Array<string>(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCountdown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);
    setError("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    if (!pastedDigits.length) return;
    setDigits(Array.from({ length: OTP_LENGTH }, (_, index) => pastedDigits[index] ?? ""));
    inputRefs.current[Math.min(pastedDigits.length, OTP_LENGTH) - 1]?.focus();
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Enter the complete six-digit verification code.");
      return;
    }

    try {
      setError("");
      setNotice("");
      setIsVerifying(true);
      const result = await authService.verifyOtp({ token, otp });
      savePasswordSetupToken(result.setupToken);
      router.push("/create-password");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsVerifying(false);
    }
  }

  async function resendOtp() {
    if (!token || resendCountdown > 0) return;
    try {
      setError("");
      setNotice("");
      setIsResending(true);
      await authService.sendOtp({ token });
      setDigits(Array<string>(OTP_LENGTH).fill(""));
      setResendCountdown(60);
      setNotice("A new verification code was sent to your company email.");
      inputRefs.current[0]?.focus();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsResending(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-9 text-center shadow-xl shadow-slate-200/50">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">!</div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Activation token missing</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Open the original activation link from your company email and continue again.</p>
        <Link href="/login" className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700">OTP</div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Email verification</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Enter verification code</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          We sent a six-digit code to <span className="font-semibold text-slate-700">{email || "your company email"}</span>.
          The code expires in 10 minutes.
        </p>
      </div>

      <form onSubmit={verifyOtp} className="mt-8" noValidate>
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => { inputRefs.current[index] = element; }}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`OTP digit ${index + 1}`}
              maxLength={1}
              className="h-12 w-11 rounded-xl border border-slate-300 text-center text-xl font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-14 sm:w-13"
            />
          ))}
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

        <button type="submit" disabled={isVerifying} className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isVerifying ? "Verifying..." : "Verify code"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Didn&apos;t receive the code?{" "}
        <button type="button" onClick={resendOtp} disabled={resendCountdown > 0 || isResending} className="font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400">
          {isResending ? "Sending..." : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
