import Link from "next/link";
import Image from "next/image";
import styles from "./landing.module.css";

export default function LandingFooter() {
  return (
    <>
      <section id="get-started" className={styles.ctaSection}><div className={styles.container}><div className={styles.cta}>
        <span className={styles.badge}>A performance process built around your policies</span><h2>Make performance management work your way.</h2><p>Configure your review process, align goals, evaluate performance, and manage performance decisions through one adaptable platform.</p>
        <div className={styles.actions}><a href="#request-access" className={styles.button}>Request Access →</a><a href="#platform" className={[styles.button, styles.secondary, styles.outlineAction].join(" ")}>Explore the Platform ↗</a></div>
        <div id="request-access" className={styles.accessInstructions} tabIndex={-1}><h3>Request your account from HR.</h3><p>Ask your organization&apos;s HR team to invite you using your company email. Follow the activation instructions in that email. Already invited? <Link href="/login">Log in</Link>.</p></div>
      </div></div></section>
      <footer className={styles.footer}><div className={styles.container}><div className={styles.footerSimple}><Link href="/" className={[styles.brand, styles.brandWithMark].join(" ")}><Image src="/images/corpdev360-mark.png" alt="" width={36} height={36} className={styles.brandMark} /><span className={styles.brandWordmark}>CorpDev <span>360</span></span></Link><p>Configurable performance management for your organization.</p><nav aria-label="Footer navigation"><a href="#security">Governance</a><a href="#faq">FAQ</a><Link href="/login">Login</Link></nav></div><div className={styles.copyright}>© {new Date().getFullYear()} CorpDev 360. All rights reserved.</div></div></footer>
    </>
  );
}
