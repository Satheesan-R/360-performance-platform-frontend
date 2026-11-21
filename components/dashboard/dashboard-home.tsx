import Link from "next/link";
import { employeeWorkspace } from "./workspaces";

const tones = [
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-violet-50 text-violet-700",
  "bg-amber-50 text-amber-700",
];

export default function DashboardHome() {
  return (
    <main className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{employeeWorkspace.title}</h1>
          <p className="mt-2 text-slate-600">{employeeWorkspace.description}</p>
        </div>
        <Link href="/employee/profile" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          View my profile
        </Link>
      </div>

      <section aria-labelledby="workspace-areas" className="mt-8">
        <h2 id="workspace-areas" className="text-lg font-bold text-slate-900">My workspace</h2>
        <p className="mt-1 text-sm text-slate-600">Live goals, reviews, feedback, and development data are awaiting integration.</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employeeWorkspace.areas.map((area, index) => (
            <li key={area.title} className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className={`rounded-lg px-2.5 py-1 text-sm font-bold ${tones[index]}`}>{area.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{area.description}</p>
              <Link href={area.href} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">
                View {area.title.toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
