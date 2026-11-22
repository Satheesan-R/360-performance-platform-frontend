"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { secondaryClass } from "@/components/organization/ui";
import TemplateEditor from "@/components/performance-framework/template-editor";

const templatesPath = "/hr/performance-framework/templates";

export default function Page() {
  const router = useRouter();

  function returnToTemplates() {
    router.replace(templatesPath);
  }

  return (
    <>
      <Link href={templatesPath} className={`${secondaryClass} mb-5 inline-block`}>
        ← Back to Review Templates
      </Link>
      <TemplateEditor onSaved={returnToTemplates} />
    </>
  );
}
