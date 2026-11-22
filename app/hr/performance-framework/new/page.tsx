"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { secondaryClass } from "@/components/organization/ui";
import { FrameworkForm } from "@/components/performance-framework/overview";

const overviewPath = "/hr/performance-framework";

export default function Page() {
  const router = useRouter();

  function returnToOverview() {
    router.replace(overviewPath);
  }

  return (
    <>
      <Link href={overviewPath} className={`${secondaryClass} mb-5 inline-block`}>
        ← Back to Framework Overview
      </Link>
      <FrameworkForm framework={null} onCancel={returnToOverview} onSaved={returnToOverview} />
    </>
  );
}
