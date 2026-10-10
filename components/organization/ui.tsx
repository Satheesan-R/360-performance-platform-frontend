import type { ReactNode } from "react";

export const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";
export const buttonClass = "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50";
export const secondaryClass = "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-2 text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>;
}

export function Status({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${value === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{value === "active" ? "Active" : "Inactive"}</span>;
}

export function ResourceState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading organization data...</p>;
  if (error) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><p>{error}</p><button type="button" onClick={retry} className={`${secondaryClass} mt-3`}>Try again</button></div>;
  return null;
}

export function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>{children}</div>;
}
