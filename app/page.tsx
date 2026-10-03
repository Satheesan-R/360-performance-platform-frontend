import type { Metadata } from "next";
import styles from "@/components/landing/landing.module.css";
import LandingHeader from "@/components/landing/landing-header";
import Hero from "@/components/landing/hero";
import PerformancePreview from "@/components/landing/performance-preview";
import PlatformFeatures from "@/components/landing/platform-features";
import RoleWorkspaces from "@/components/landing/role-workspaces";
import GrowthOutcomes from "@/components/landing/growth-outcomes";
import LandingFooter from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "CorpDev 360 | Build better teams",
  description: "Connect goals, feedback, performance reviews, and career development in one workspace.",
};

export default function HomePage() {
  return (
    <div className={styles.landing}>
      <LandingHeader />
      <main>
      <Hero />
      <PerformancePreview />
      <PlatformFeatures />
      <RoleWorkspaces />
      <GrowthOutcomes />
      </main>
      <LandingFooter />
    </div>
  );
}
