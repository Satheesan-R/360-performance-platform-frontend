import type { Metadata } from "next";
import styles from "@/components/landing/landing.module.css";
import LandingHeader from "@/components/landing/landing-header";
import Hero from "@/components/landing/hero";
import PlatformFeatures from "@/components/landing/platform-features";
import RoleWorkspaces from "@/components/landing/role-workspaces";
import PerformancePreview from "@/components/landing/performance-preview";
import GrowthOutcomes from "@/components/landing/growth-outcomes";
import LandingFooter from "@/components/landing/landing-footer";
import { HowItWorks, PerformanceFramework, ReviewWorkflows, Governance } from "@/components/landing/product-workflow";
import { ScoringGovernance, ReviewCycles, DashboardReporting, OrganizationFit } from "@/components/landing/scope-sections";

export const metadata: Metadata = {
  title: "CorpDev 360 | Configurable Performance Management",
  description: "Explore CorpDev 360: configurable performance frameworks, review templates, weighted scoring previews and the roadmap for a connected performance lifecycle.",
};

export default function HomePage() {
  return (
    <div className={styles.landing}>
      <LandingHeader />
      <main>
        <Hero />
        <PlatformFeatures />
        <ReviewWorkflows />
        <PerformanceFramework />
        <HowItWorks />
        <ScoringGovernance />
        <RoleWorkspaces />
        <PerformancePreview />
        <ReviewCycles />
        <DashboardReporting />
        <Governance />
        <OrganizationFit />
        <GrowthOutcomes />
      </main>
      <LandingFooter />
    </div>
  );
}
