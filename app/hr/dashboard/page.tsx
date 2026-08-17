const summaryCards = [
  { label: "Total employees", value: "—", detail: "Employee directory", tone: "bg-blue-50 text-blue-700" },
  { label: "Pending onboarding", value: "—", detail: "Awaiting activation", tone: "bg-amber-50 text-amber-700" },
  { label: "Active review cycles", value: "—", detail: "Currently in progress", tone: "bg-emerald-50 text-emerald-700" },
  { label: "Reviews to normalise", value: "—", detail: "Action required", tone: "bg-violet-50 text-violet-700" },
];

export default function HrDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">HR Dashboard</h1>
          <p className="mt-2 text-slate-500">Track onboarding, review cycles, and workforce activity.</p>
        </div>
        <a href="/hr/onboarding" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Add employee
        </a>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-5 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${card.tone}`}>{card.label}</div>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Employee onboarding</h2>
              <p className="mt-1 text-sm text-slate-500">Recently invited employees will appear here.</p>
            </div>
            <a href="/hr/onboarding" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View onboarding</a>
          </div>
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <p className="font-semibold text-slate-700">No onboarding activity loaded yet</p>
            <p className="mt-2 text-sm text-slate-500">We will connect employee data after completing the onboarding page.</p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          <div className="mt-5 space-y-3">
            <a href="/hr/onboarding" className="block rounded-xl border border-slate-200 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50">
              <p className="font-semibold text-slate-800">Onboard an employee</p>
              <p className="mt-1 text-sm text-slate-500">Create a profile and send activation mail.</p>
            </a>
            <a href="/hr/review-cycles" className="block rounded-xl border border-slate-200 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50">
              <p className="font-semibold text-slate-800">Create review cycle</p>
              <p className="mt-1 text-sm text-slate-500">Prepare the next performance review.</p>
            </a>
            <a href="/hr/analytics" className="block rounded-xl border border-slate-200 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50">
              <p className="font-semibold text-slate-800">View analytics</p>
              <p className="mt-1 text-sm text-slate-500">Explore workforce performance trends.</p>
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
