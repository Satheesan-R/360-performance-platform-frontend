import styles from "./landing.module.css";

export default function Hero() {
  return (
    <section
      className={styles.heroSplit}
      aria-labelledby="hero-title"
    >
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <span className={styles.heroBadge}>
            Configurable performance management SaaS
          </span>
          <h1 id="hero-title">
            Your review process.
            <br />
            Your rules. <span>No code.</span>
          </h1>
          <p className={styles.heroDescription}>
            Design your own review workflows, scoring models and governance,
            then run fair, traceable 360° evaluations for interns, probationers
            and permanent staff.
          </p>
          <div className={styles.heroActions}>
            <a
              href="/login"
              className={styles.heroPrimary}
            >
              Request login
            </a>
            <a
              href="#platform"
              className={styles.heroSecondary}
            >
              See how it works <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
