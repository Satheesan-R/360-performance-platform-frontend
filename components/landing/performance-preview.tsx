import styles from "./landing.module.css";

const goals = [
  ["Cross-Microservices Latency Reduction", 85, "Owner: Infrastructure Guild"],
  ["Self-Service Multi-Tenant Provisioning Workflow", 72, "Owner: Platform Engineering"],
  ["SOC 2 Type II Automated Compliance Checks", 100, "Owner: Security & Compliance"],
] as const;
const cells = [["Future Star", 18], ["Top Talent", 34], ["Key Leader", 22], ["Core Growth", 56], ["High Impact", 41], ["Specialist", 19], ["Developing", 9], ["Action Plan", 4], ["Onboarding", 12]] as const;

export default function PerformancePreview() {
  return <section id="performance" className={styles.preview} aria-label="Illustrative performance dashboard">
    <div className={styles.container}><div className={styles.window}>
      <div className={styles.windowBar}><span className={styles.dot}/><span className={styles.dot}/><span className={styles.dot}/><span className={styles.address}>◈ corpdev360 / performance workspace</span><span className={styles.live}>◉ Connected team insights</span></div>
      <div className={styles.metrics}>
        {[["Review Completion", "98.4%", "A clear view of every review"], ["Strategic OKRs Aligned", "142", "94 Jira sprints actively linked"], ["Talent Calibration Index", "4.35 / 5", "High-density talent cohort"], ["Team Feedback", "Live Sync", "Feedback that moves you forward"]].map(([label, value, note]) => <div className={styles.metric} key={label}><small>{label}</small><strong className={label === "Team Feedback" ? styles.blue : undefined}>{value}</strong><span>{note}</span></div>)}
      </div>
      <div className={styles.panels}>
        <div className={styles.panel}><h3>Active Enterprise OKR Alignment</h3><p>Connect daily execution to your team&apos;s bigger goals.</p>{goals.map(([name, progress, owner]) => <div key={name} className={styles.okr}><div className={styles.okrLabel}><strong>{name}</strong><span className={styles.blue}>{progress}%</span></div><div className={styles.bar}><span style={{width: `${progress}%`}}/></div><span>{owner}</span></div>)}</div>
        <div className={styles.panel}><h3>Talent Calibration Matrix</h3><p>A shared view of performance and growth potential.</p><div className={styles.matrix}>{cells.map(([label, count], index) => <div key={label} className={`${styles.cell} ${index === 1 ? styles.selected : ""}`}>{label}<strong>{count}</strong></div>)}</div><p>Make development conversations more meaningful.</p></div>
      </div>
    </div><p className={styles.demoNote}>Illustrative product preview · Sample data shown</p></div>
  </section>;
}
