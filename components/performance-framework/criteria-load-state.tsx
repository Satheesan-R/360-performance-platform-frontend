import { secondaryClass } from "@/components/organization/ui";

export default function CriteriaLoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p role="status" className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading framework criteria...</p>;
  if (error) return <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-700"><p>{error}</p><button type="button" onClick={retry} className={`${secondaryClass} mt-3`}>Try again</button></div>;
  return null;
}
