import Image from "next/image";
import styles from "./landing.module.css";

export default function Hero() {
  return (
    <section className={[styles.heroSplit, styles.scopeHero].join(" ")} aria-labelledby="hero-title">
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <span className={styles.heroBadge}>Configurable 360° performance management</span>
          <h1 id="hero-title">Your performance process.<br />Your rules. <span>No code changes.</span></h1>
          <p className={styles.heroDescription}>Configure performance review workflows, align employee goals, evaluate performance, calculate scores, and manage promotion recommendations through a performance management platform designed around your organization&apos;s policies.</p>
          <div className={styles.heroActions}>
            <a href="#get-started" className={styles.heroPrimary}>Request Access <span aria-hidden="true">→</span></a>
            <a href="#platform" className={styles.heroSecondary}>Explore the Platform <span aria-hidden="true">↗</span></a>
          </div>
          <p className={styles.heroSupporting}>From employee self-reviews to final performance decisions, manage the process in one configurable platform.</p>
          <p className={styles.availabilityNote}><strong>Product direction:</strong> this describes the intended scope. Onboarding is connected; configuration, scoring previews and draft manager cycles are supported by the backend. Other lifecycle stages are planned.</p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroTeamPhoto}>
            <Image src="/images/landing-team.webp" alt="Colleagues collaborating around a table in a bright office" fill sizes="(max-width: 800px) calc(100vw - 48px), 45vw" preload className={styles.heroTeamImage} />
          </div>
        </div>
      </div>
    </section>
  );
}
