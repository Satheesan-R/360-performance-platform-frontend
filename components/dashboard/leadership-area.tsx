import Link from "next/link";
import { notFound } from "next/navigation";
import { leadershipWorkspaces, type LeadershipRole } from "./leadership-workspaces";

export default function LeadershipArea({ role, slug }: { role: LeadershipRole; slug: string }) {
  const workspace = leadershipWorkspaces[role];
  const area = Object.entries(workspace.areas).find(([key]) => key === slug)?.[1];
  if (!area) notFound();

  return (
    <main className="mx-auto max-w-7xl">
      <Link href={`${workspace.base}/dashboard`} className="text-sm font-semibold text-blue-700 hover:underline">Back to dashboard</Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{area.title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{area.description}</p>

      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <section aria-labelledby="preparation" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 id="preparation" className="text-lg font-bold text-slate-950">Preparation checklist</h2>
          <ol className="mt-4 divide-y divide-slate-100">
            {area.checklist.map((item, index) => (
              <li key={item.title} className="flex gap-4 py-4">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="availability" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 id="availability" className="text-lg font-bold text-slate-950">Live data</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{area.availability}</p>
        </section>
      </div>
    </main>
  );
}
