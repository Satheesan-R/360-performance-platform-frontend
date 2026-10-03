import Link from "next/link";
import styles from "./landing.module.css";
export default function LandingFooter() {
  return (
    <>
      <section id="get-started" className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.cta}>
            <span className={styles.badge}>
              ↗ Build a high-performing team
            </span>
            <h2>
              Transform how your organization sets goals, reviews performance,
              and develops talent.
            </h2>
            <p>
              Bring your people and priorities together. Sign in to your
              workspace and take the next step toward better performance
              conversations.
            </p>
            <div className={styles.actions}>
              <Link href="/login" className={styles.button}>
                Go to Login →
              </Link>
              <a
                href="#platform"
                className={`${styles.button} ${styles.secondary}`}
              >
                Explore the Platform ↗
              </a>
            </div>
            <div className={styles.checks}>
              ✓ Connected goals &nbsp; · &nbsp; ✓ Continuous feedback &nbsp; ·
              &nbsp; ✓ Career development
            </div>
          </div>
        </div>
      </section>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <Link href="/" className={styles.brand}>
                <span>◈</span> CorpDev <span>360</span>
              </Link>
              <p>
                Unified performance and development for ambitious teams. Align
                your goals, support your people, and grow together.
              </p>
            </div>
            <div>
              <h3>Platform</h3>
              <a href="#performance">Performance overview</a>
              <a href="#platform">Goals &amp; OKRs</a>
              <a href="#platform">Feedback &amp; reviews</a>
              <a href="#platform">Career development</a>
            </div>
            <div>
              <h3>Solutions</h3>
              <a href="#solutions">For employees</a>
              <a href="#solutions">For managers</a>
              <a href="#solutions">For HR &amp; leadership</a>
            </div>
            <div>
              <h3>Your Workspace</h3>
              <Link href="/login">login</Link>
              <a href="#get-started">Get started</a>
              <a href="#solutions">Find your role</a>
            </div>
          </div>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} CorpDev 360. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
