import Link from "next/link";
import styles from "./landing.module.css";

export default function Hero() {
  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.container}>
          <div className={styles.announcement}>
            <b>NEW</b> One connected workspace for your team&apos;s growth{" "}
            <a href="#platform">Explore the platform →</a>
          </div>
          <div>
            <span className={styles.badge}>
              ✧ Unified Talent, OKR &amp; People Operating System
            </span>
          </div>
          <h1 id="hero-title">
            The Complete 360° Operating System for{" "}
            <span className={styles.blue}>High-Performing</span> Engineering
            &amp; Corporate Teams
          </h1>
          <p className={styles.lead}>
            Unify quarterly OKRs, real-time feedback, 360° evaluation cycles,
            skill development, and career growth in one seamless workspace.
          </p>
          <div className={styles.actions}>
            <Link href="/login" className={styles.button}>
              Get Started →
            </Link>
            <a
              href="#performance"
              className={`${styles.button} ${styles.secondary}`}
            >
              Explore the Platform ↗
            </a>
          </div>
          <div className={styles.trusted}>
            <p className={styles.eyebrow}>
              Built for ambitious teams, at every stage
            </p>
            <div className={styles.logos}>
              <span>♧ Engineering</span>
              <span>▥ People &amp; HR</span>
              <span>▣ Operations</span>
              <span>◈ Leadership</span>
              <span>⌘ Product</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
