import Link from "next/link";
import styles from "./landing.module.css";

export default function Hero() {
  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.container}>
          <div>
            <span className={styles.badge}>Performance &amp; Development</span>
          </div>
          <h1 id="hero-title">Build stronger teams. <span className={styles.blue}>Drive better performance.</span></h1>
          <p className={styles.lead}>Align goals, share feedback, and grow talent in one connected workspace.</p>
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
