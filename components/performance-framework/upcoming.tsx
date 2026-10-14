import Link from "next/link";
import { PageHeading, secondaryClass } from "@/components/organization/ui";

export default function UpcomingFrameworkPage({ title, description }: { title: string; description: string }) {
  return <>
    <PageHeading title={title} description={description} />
    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="text-lg font-semibold">Coming next</h2>
      <p className="mb-6 mt-2 text-sm text-slate-500">This configuration will be available when its backend module is ready. You can create and manage frameworks in the overview now.</p>
      <Link className={secondaryClass} href="/hr/performance-framework">Back to Framework Overview</Link>
    </section>
  </>;
}
