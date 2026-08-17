import Link from "next/link";

export default function AccountSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-600">✓</div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Activation complete</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Account created successfully</h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Your company account is active. You can now sign in using your company email and the password you created.
        </p>
        <Link href="/login" className="mt-8 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700">
          Go to login
        </Link>
        <p className="mt-5 text-xs text-slate-400">Welcome to the 360 Performance Platform.</p>
      </div>
    </main>
  );
}
