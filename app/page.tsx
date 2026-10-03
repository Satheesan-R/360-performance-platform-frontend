import type { Metadata } from "next";
import styles from "@/components/landing/landing.module.css";
import Hero from "@/components/landing/hero";

export const metadata: Metadata = {
  title: "CorpDev 360 | Build better teams",
  description: "Connect goals, feedback, performance reviews, and career development in one workspace.",
};

export default function HomePage() {
  return (
    <div className={styles.landing}>
      <Hero />
    </div>
  );
}
