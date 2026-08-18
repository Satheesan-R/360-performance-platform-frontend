const cards = [
  { label: "Current goals", value: "—", detail: "Goals currently in progress", color: "bg-blue-50 text-blue-700" },
  { label: "Review status", value: "—", detail: "Current performance cycle", color: "bg-emerald-50 text-emerald-700" },
  { label: "Feedback received", value: "—", detail: "Feedback in this cycle", color: "bg-violet-50 text-violet-700" },
];

export default function EmployeeDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl">
      <div>
        <p className="text-sm font-semibold text-blue-600">MY OVERVIEW</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Employee Dashboard</h1>
        <p className="mt-2 text-slate-500">Track your goals, reviews, feedback, and professional growth.</p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${card.color}`}>{card.label}</span>
            <p className="mt-5 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-lg font-bold text-slate-900">Current review cycle</h2><p className="mt-1 text-sm text-slate-500">Your active performance review will appear here.</p></div>
            <a href="/employee/reviews" className="shrink-0 text-sm font-semibold text-blue-600">View reviews</a>
          </div>
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <p className="font-semibold text-slate-700">No review data loaded yet</p>
            <p className="mt-2 text-sm text-slate-500">Review data will be connected when its backend module is available.</p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          <div className="mt-5 space-y-3">
            <a href="/employee/profile" className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"><p className="font-semibold text-slate-800">View my profile</p><p className="mt-1 text-sm text-slate-500">Check your employee information.</p></a>
            <a href="/employee/goals" className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"><p className="font-semibold text-slate-800">Open my goals</p><p className="mt-1 text-sm text-slate-500">Track goal progress and updates.</p></a>
            <a href="/employee/feedback" className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"><p className="font-semibold text-slate-800">View feedback</p><p className="mt-1 text-sm text-slate-500">Read feedback shared with you.</p></a>
          </div>
        </article>
      </section>
    </main>
  );
}
