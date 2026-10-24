import styles from "./landing.module.css";

const goals = [
  ["Organization Goals", "Improve customer support reliability.", "Sample objective"],
  ["Team Goals", "Reduce first-response time from 8 hours to 4 hours.", "Sample key result"],
  ["Individual Goals", "Maintain the triage checklist and review progress weekly.", "Sample contribution"],
];

export default function PerformancePreview() {
  return (
    <section id="performance" className={styles.section}><div className={styles.container}>
      <div className={styles.heading}><span className={styles.eyebrow}>OKRs & goal alignment · planned</span><h2>Connect organizational goals to individual performance.</h2><p>The intended goal module connects organization, team and individual goals, with progress and completion tracking throughout a performance cycle. This module is not implemented yet.</p></div>
      <div className={styles.goalExample}><div className={styles.exampleHeader}><span className={styles.eyebrow}>Conceptual goal alignment</span><span>Illustrative sample data · not live results</span></div><ol className={styles.goalAlignment}>{goals.map(([title, text, label], index) => <li key={title}><span className={styles.stepNumber}>0{index + 1}</span><h3>{title}</h3><p>{text}</p><small>{label}</small>{index < goals.length - 1 && <span className={styles.goalArrow} aria-hidden="true">→</span>}</li>)}</ol></div>
      <div className={styles.scopeLegend}><span>Goal cascading · planned</span><span>Progress tracking · planned</span><span>Completion percentages · planned</span><span>Review-cycle alignment · planned</span></div>
    </div></section>
  );
}
