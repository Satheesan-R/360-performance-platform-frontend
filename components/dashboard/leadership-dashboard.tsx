import Link from "next/link";
import { leadershipWorkspaces, type LeadershipRole } from "./leadership-workspaces";

const tones = ["bg-blue-50 text-blue-700", "bg-violet-50 text-violet-700", "bg-emerald-50 text-emerald-700"];

export default function LeadershipDashboard({ role }: { role: LeadershipRole }) {
  const workspace = leadershipWorkspaces[role];
  const areas = Object.entries(workspace.areas);

  return (
    <main className="mx-auto max-w-7xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">{workspace.title} Dashboard</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{workspace.description}</p>

      <section aria-label="Workspace areas" className="mt-7 grid gap-4 md:grid-cols-3">
        {areas.map(([slug, area], index) => (
          <Link key={slug} href={`${workspace.base}/${slug}`} className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30">
            <span aria-hidden="true" className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${tones[index]}`}>{area.short}</span>
            <h2 className="mt-4 font-bold text-slate-950">{area.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{area.description}</p>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section aria-labelledby="workflow" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 id="workflow" className="text-lg font-bold text-slate-950">Preparation checklist</h2>
          <ol className="mt-2 divide-y divide-slate-100">
            {areas.map(([slug, area]) => (
              <li key={slug} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{area.checklist[0].title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{area.checklist[0].detail}</p>
                </div>
                <Link href={`${workspace.base}/${slug}`} className="text-sm font-semibold text-blue-700 hover:underline">
                  Open {area.title.toLowerCase()}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="assignments" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 id="assignments" className="text-lg font-bold text-slate-950">Review assignments</h2>
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{areas[0][1].availability}</p>
        </section>
      </div>
    </main>
  );
}
