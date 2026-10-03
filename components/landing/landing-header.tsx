import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingHeader() {
  return (
    <header className={styles.header}>
      <nav className={`${styles.container} ${styles.nav}`} aria-label="Main navigation">
        <Link href="/" className={styles.brand}><span>◈</span> CorpDev <span>360</span></Link>
        <div className={styles.links}><a href="#platform">Platform</a><a href="#solutions">Solutions</a><a href="#performance">OKRs &amp; Performance</a><a href="#get-started">Get started</a></div>
        <Link href="/login" className={styles.button}>Employee Login ↗</Link>
      </nav>
    </header>
  );
}
