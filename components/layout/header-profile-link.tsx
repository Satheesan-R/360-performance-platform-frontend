"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/use-current-user";
import { getSelfProfile } from "@/services/personal-settings.service";
import type { SelfProfile } from "@/lib/personal-settings";

export default function HeaderProfileLink({ fallback }: { fallback: string }) {
  const user = useCurrentUser();
  // A different account must never inherit the previous account's photograph.
  return <ProfileLink key={`${user?.id}:${user?.role}`} userId={user?.id} fallback={fallback} />;
}

function ProfileLink({ userId, fallback }: { userId?: string; fallback: string }) {
  const [profile, setProfile] = useState<SelfProfile | null>(null);
  useEffect(() => {
    if (!userId) return;
    let pending: AbortController | undefined;
    function refresh() {
      pending?.abort();
      const controller = new AbortController(); pending = controller;
      getSelfProfile(controller.signal).then(value => {
        if (!controller.signal.aborted && value.id === userId) setProfile(value);
      }).catch(() => { /* Keep initials or the last verified profile on a temporary error. */ });
    }
    function updated(event: Event) {
      if ((event as CustomEvent<{ id: string }>).detail?.id === userId) refresh();
    }
    refresh();
    window.addEventListener("performance-profile-updated", updated);
    window.addEventListener("focus", refresh);
    return () => {
      pending?.abort();
      window.removeEventListener("performance-profile-updated", updated);
      window.removeEventListener("focus", refresh);
    };
  }, [userId]);
  const photo = profile?.details?.photo;
  return <Link href="/settings?section=profile" aria-label="Open your profile settings" title="Profile settings" className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700 transition hover:bg-blue-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
    {photo ? (
      // Saved profile photos are cropped data URLs, not remote optimized images.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt="" className="h-full w-full object-cover" />
    ) : fallback}
  </Link>;
}
