"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";
const roles = [
  {
    label: "For Employees",
    eyebrow: "Individual Contributors & Staff Engineers",
    title: "Know exactly where you stand, what matters most, and how to grow.",
    description:
      "Make growth a continuous conversation. See your goals, feedback, and development opportunities in one personal workspace.",
    bullets: [
      "Track goals and the work that moves them forward.",
      "Reflect on feedback and build your development plan.",
      "Prepare for reviews with a clear picture of your progress.",
    ],
    person: "Alex Liang",
    initials: "AL",
    job: "Staff Platform Engineer",
    metric: "Competency roadmap: Distributed Systems",
    status: "Learning in progress",
    progress: 86,
    note: "Your next step: review peer feedback and update your quarterly development goals.",
  },
  {
    label: "For Managers & Tech Leads",
    eyebrow: "Team Leaders & Engineering Managers",
    title: "Help your people thrive while keeping your team aligned.",
    description:
      "Bring team goals and performance conversations into focus. Identify where support is needed and celebrate progress together.",
    bullets: [
      "Connect individual objectives to your team’s priorities.",
      "Bring context into feedback and review conversations.",
      "Build practical development plans with your team.",
    ],
    person: "Jordan Rivera",
    initials: "JR",
    job: "Engineering Manager",
    metric: "Team objective: Platform reliability",
    status: "On track this quarter",
    progress: 78,
    note: "Your next step: discuss goal progress in your upcoming team check-ins.",
  },
  {
    label: "For HR Leaders & Executives",
    eyebrow: "People Teams & Business Leaders",
    title: "Bring clarity and consistency to every performance cycle.",
    description:
      "Coordinate reviews, understand talent development, and connect your people strategy with organizational priorities.",
    bullets: [
      "Manage performance cycles from one shared workspace.",
      "Support consistent, informed talent conversations.",
      "Understand progress across teams and departments.",
    ],
    person: "Sam Taylor",
    initials: "ST",
    job: "People Operations Lead",
    metric: "Quarterly review cycle",
    status: "Reviews approaching completion",
    progress: 94,
    note: "Your next step: review completion across departments and prepare calibration discussions.",
  },
];
export default function RoleWorkspaces() {
  const [active, setActive] = useState(0);
  const role = roles[active];
  return (
    <section id="solutions" className={`${styles.section} ${styles.roles}`}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Role-Tailored Architecture</span>
          <h2>Built for Every Role in the Modern Enterprise</h2>
          <p>
            A focused experience for individual contributors, managers, and
            people leaders. One shared purpose: helping your team grow.
          </p>
        </div>
        <div className={styles.tabs} aria-label="Choose a role">
          {roles.map((item, index) => (
            <button
              type="button"
              key={item.label}
              className={`${styles.tab} ${active === index ? styles.activeTab : ""}`}
              aria-pressed={active === index}
              aria-controls="role-workspace"
              onClick={() => setActive(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          id="role-workspace"
          className={styles.rolePanel}
          aria-live="polite"
        >
          <div className={styles.roleCopy}>
            <span className={styles.eyebrow}>{role.eyebrow}</span>
            <h3>{role.title}</h3>
            <p>{role.description}</p>
            <ul>
              {role.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <Link href="/login">Open your workspace →</Link>
          </div>
          <div className={styles.profile}>
            <div className={styles.person}>
              <span className={styles.avatar}>{role.initials}</span>
              <div>
                <strong>{role.person}</strong>
                <small>{role.job} · Example profile</small>
              </div>
            </div>
            <div className={styles.profileDetail}>
              <strong>{role.metric}</strong>
              <p>{role.status}</p>
              <div className={styles.bar}>
                <span style={{ width: `${role.progress}%` }} />
              </div>
            </div>
            <div className={styles.profileDetail}>
              <strong>A clearer path forward</strong>
              <p>{role.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
