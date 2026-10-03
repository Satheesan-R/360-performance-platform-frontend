import type { Metadata } from "next";
import styles from "@/components/landing/landing.module.css";
import Hero from "@/components/landing/hero";
import PerformancePreview from "@/components/landing/performance-preview";
import PlatformFeatures from "@/components/landing/platform-features";
import RoleWorkspaces from "@/components/landing/role-workspaces";

export const metadata: Metadata = {
  title: "CorpDev 360 | Build better teams",
  description: "Connect goals, feedback, performance reviews, and career development in one workspace.",
};

export default function HomePage() {
  return (
    <div className={styles.landing}>
      <Hero />
      <PerformancePreview />
      <PlatformFeatures />
      <RoleWorkspaces />
    </div>
  );
}
