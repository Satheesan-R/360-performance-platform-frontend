import styles from "./landing.module.css";
const features = [
  ["⚑", "Strategic OKRs & Goal Hierarchy", "Cascade company objectives into individual goals. Connect work across teams, track progress, and keep everyone moving in the same direction.", "Explore goal alignment"],
  ["▤", "Continuous Daily Feedback & Reflection", "Turn everyday feedback into lasting growth. Capture insights, recognize contributions, and make development a regular conversation.", "Discover continuous feedback"],
  ["⇄", "360° Multi-Rater Review Cycles", "Bring together feedback from peers, managers, and team members for a fuller picture of performance and potential.", "Explore 360° reviews"],
  ["◇", "Competency Gaps & Upskilling", "Understand your team’s strengths and development needs. Build focused learning paths that support the next step in every career.", "See development pathways"],
  ["▥", "People Analytics & Retention Intelligence", "Connect performance, engagement, and growth insights so leaders can make more informed decisions about their teams.", "Explore people insights"],
  ["◈", "Enterprise Governance & Security", "Keep access aligned with responsibilities through dedicated employee and HR workspaces and role-based permissions.", "Discover team workspaces"],
];
export default function PlatformFeatures() {
  return <section id="platform" className={styles.section}><div className={styles.container}>
    <div className={styles.heading}><span className={styles.eyebrow}>Enterprise Performance Infrastructure</span><h2>Everything Required to Scale Engineering &amp; Corporate Excellence</h2><p>Bring your performance conversations, goals, and development plans together. Give every team the clarity to do their best work.</p></div>
    <div className={styles.grid}>{features.map(([icon, title, description, link]) => <article className={styles.card} key={title}><span className={styles.icon} aria-hidden="true">{icon}</span><h3>{title}</h3><p>{description}</p><a href="#solutions">{link} →</a></article>)}</div>
  </div></section>;
}
