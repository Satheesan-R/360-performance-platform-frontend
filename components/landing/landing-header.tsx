"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

const navigation = [
  ["#platform", "Platform"],
  ["#review-workflows", "Review Workflows"],
  ["#framework", "Performance Framework"],
  ["#performance", "OKRs & Goals"],
  ["#reports", "Reports & Governance"],
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <header className={styles.header} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <nav className={[styles.container, styles.nav, styles.scopeNav].join(" ")} aria-label="Main navigation">
        <Link href="/" className={styles.brand} aria-label="CorpDev 360 home">CorpDev <span>360</span></Link>
        <button ref={toggle} type="button" className={styles.menuToggle} aria-expanded={open} aria-controls="landing-navigation" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}<span aria-hidden="true">{open ? " ×" : " ☰"}</span>
        </button>
        <div id="landing-navigation" className={[styles.scopeLinks, open ? styles.menuOpen : ""].join(" ")}>
          {navigation.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        </div>
        <div className={styles.headerActions}>
          <a href="#get-started" className={styles.headerRequest} onClick={() => setOpen(false)}>Request Access</a>
          <Link href="/login" className={[styles.button, styles.navLogin].join(" ")}>Login <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>
    </header>
  );
}
