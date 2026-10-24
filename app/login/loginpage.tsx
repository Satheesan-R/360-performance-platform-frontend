"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./login.module.css";
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
    <main className={styles.page}>
      <section className={styles.brandPanel} aria-labelledby="brand-heading">
        <Link href="/" className={styles.brand} aria-label="CorpDev 360 home">
          <Image src="/images/corpdev360-mark.png" alt="" width={48} height={48} className={styles.loginBrandMark} />
          <span><strong>CorpDev <b>360°</b></strong><small>Performance &amp; Talent Governance</small></span>
        </Link>
        <div className={styles.brandStory}>
          <span className={styles.edition}><i aria-hidden="true" />GROW TOGETHER · CORPDEV 360</span>
          <h1 id="brand-heading">Build stronger teams through meaningful, measurable performance.</h1>
          <p>Bring clarity to performance expectations with configurable competencies, rating scales and review templates.</p>
          <div className={styles.processCard}>
            <div className={styles.processHeading}><span className={styles.check} aria-hidden="true">✓</span><div><small>Your performance process</small><strong>Your rules. No code changes.</strong></div><span className={styles.configTag}>Configurable</span></div>
            <div className={styles.processSteps}><span>Define criteria</span><span aria-hidden="true">→</span><span>Set weights</span><span aria-hidden="true">→</span><span>Preview scoring</span></div>
            <p>Framework and scoring configuration supported by the backend.</p>
          </div>
        </div>
        <div className={styles.brandFoot}><span aria-hidden="true">◇</span> Role-based access <span aria-hidden="true">·</span> Configurable frameworks <span aria-hidden="true">·</span> Review templates</div>
      </section>

      <section className={styles.formPanel} aria-labelledby="login-heading">
        <div className={styles.topBar}><Link href="/" className={styles.back}><span aria-hidden="true">←</span> Back to website</Link><span className={styles.accessBadge}><span aria-hidden="true">◇</span> ROLE-BASED ACCESS</span></div>
        <div className={styles.formContent}>
          <p className={styles.mobileBrand}><Image src="/images/corpdev360-mark.png" alt="" width={28} height={28} className={styles.mobileBrandMark} />CorpDev <span>360°</span></p>
          <h2 id="login-heading">Sign in to your account</h2>
          <p className={styles.intro}>Your team, your goals, your next step forward. Use your company credentials to continue.</p>
          <div className={styles.formDivider}><span />SIGN IN WITH EMAIL<span /></div>
          <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
            <div>
              <label htmlFor="email">Company email</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" aria-describedby={error ? "login-error" : undefined} />
              </div>
            </div>
            <div>
              <div className={styles.passwordLabel}><label htmlFor="password">Password</label><details className={styles.passwordHelp}><summary>Forgot password?</summary><p>Contact your organization&apos;s HR team for help recovering access to your account.</p></details></div>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className={styles.passwordInput} aria-describedby={error ? "login-error" : undefined} />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className={styles.showPassword}>{showPassword ? "Hide" : "Show"}</button>
              </div>
            </div>
            {error && <p id="login-error" role="alert" className={styles.error}>{error}</p>}
            <button type="submit" disabled={isLoading} className={styles.submit}>{isLoading ? "Signing in..." : "Sign in to CorpDev 360"}{!isLoading && <span aria-hidden="true">→</span>}</button>
          </form>
          <aside className={styles.firstTime}><h3><span aria-hidden="true">ⓘ</span> Signing in for the first time?</h3><p>Set up your account using the activation link sent to your work email. Need assistance? Contact your organization&apos;s <strong>HR team</strong>.</p></aside>
        </div>
        <footer className={styles.formFoot}>© {new Date().getFullYear()} CorpDev 360. All rights reserved.</footer>
      </section>
    </main>
  );
}
