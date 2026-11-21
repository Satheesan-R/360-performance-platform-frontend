import ProductPlaceholder from "./product-placeholder";
import styles from "./landing.module.css";

const scoring = [
  ["Weighted Performance Scoring", "The backend preview combines reviewer contributions with configured technical, behavioural and KPI weights. This is a preview, not a finalized employee result.", "Preview supported"],
  ["Score Normalization", "Planned HR-triggered normalization with a configured algorithm, minimum team threshold and organization fallback pool. No normalization algorithm is implemented today.", "Planned"],
  ["Promotion Recommendations", "Threshold-based, matrix-based and discretionary modes are in scope, with interns excluded from eligibility. No eligibility calculation or recommendation is generated today.", "Planned"],
  ["Optional Calibration", "Planned authorized HR adjustments with mandatory justification when enabled. Calibration will be optional, not a requirement for every organization.", "Planned"],
  ["Dispute Resolution", "Planned dispute submission, secondary review, recorded resolutions and approved score updates.", "Planned"],
  ["Audit Trail", "Planned activity, score-change, review, promotion and report-generation history. Existing configuration snapshots are not a consolidated audit trail.", "Planned"],
];

export function ScoringGovernance() {
  return (
    <section id="scoring" className={styles.section}><div className={styles.container}>
      <div className={styles.heading}><span className={styles.eyebrow}>Performance scoring & governance</span><h2>Transparent scoring. Accountable decisions.</h2><p>Configured scoring previews provide the foundation. Documented evidence, normalization and decision history remain planned parts of the performance lifecycle.</p></div>
      <div className={styles.grid}>{scoring.map(([title, description, status]) => <article className={styles.card} key={title}><h3>{title}</h3><p>{description}</p><span className={status === "Planned" ? styles.plannedLabel : styles.capabilityLabel}>{status}</span></article>)}</div>
    </div></section>
  );
}

export function ReviewCycles() {
  return (
    <section id="review-cycles" className={styles.section}><div className={styles.container}>
      <div className={styles.heading}><span className={styles.eyebrow}>Employment types & review cycles</span><h2>Review cycles that fit different employment types.</h2><p>Internship, probationary and permanent employment types are supported. The cycle types below describe the planned review experience, without a fixed duration or universal schedule.</p></div>
      <div className={styles.grid}>{[["Internship Review", "A planned evaluation cycle for interns, with criteria suited to their placement."],["Probation Review", "A planned evaluation cycle for probationary employees according to organizational policy."],["Annual Review", "A planned recurring evaluation cycle for permanent employees and other eligible participants."]].map(([title, description]) => <article className={styles.card} key={title}><span className={styles.plannedLabel}>Planned cycle type</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      <div className={styles.governanceNote}><strong>What is supported now?</strong><p>The backend lets HR set dates and select eligible department-manager participants for a draft cycle using an active, approved template. Launching cycles, collecting reviews and arbitrary reviewer sequences are not available.</p></div>
    </div></section>
  );
}

export function DashboardReporting() {
  return (
    <section id="reports" className={styles.workflowSection}><div className={styles.container}>
      <div className={styles.heading}><span className={styles.eyebrow}>Dashboards & reporting</span><h2>Performance visibility at every level.</h2><p>Role-based dashboard routes exist today. Connected performance reporting is still planned; the HR dashboard currently shows employee and onboarding totals.</p></div>
      <div className={styles.grid}>{[["Employee Dashboard", "Dedicated workspace entry is available. Assigned goals, review progress, final scores, permitted feedback and development plans are planned."],["Manager Dashboard", "Dedicated manager and tech lead entries are available. Team performance, pending assessments and review-completion metrics are planned."],["HR Dashboard", "Employee listing and onboarding totals are connected. Department performance analytics, promotion eligibility and review-completion statistics are planned."]].map(([title, description]) => <article className={styles.card} key={title}><h3>{title}</h3><p>{description}</p><span className={styles.capabilityLabel}>Partially available</span></article>)}</div>
      <div className={styles.previewPair}><figure className={styles.previewFigure}><ProductPlaceholder title="HR dashboard screenshot" /><figcaption>Screenshot slot for the existing HR dashboard. Add only an anonymized capture; no real employee information should be published.</figcaption></figure><figure className={styles.previewFigure}><ProductPlaceholder title="Employee workspace screenshot" /><figcaption>Screenshot slot for the existing employee workspace. Goal, review and result modules are not yet connected.</figcaption></figure></div>
    </div></section>
  );
}

export function OrganizationFit() {
  return (
    <section id="organization-fit" className={styles.workflowSection}><div className={styles.container}>
      <div className={styles.heading}><span className={styles.eyebrow}>Designed for your organization</span><h2>Adapt performance management without rebuilding your software.</h2><p>A general product-design distinction: move organization-specific evaluation rules into configuration instead of changing code for every policy update.</p></div>
      <div className={styles.comparisonGrid}><article className={styles.comparisonCard}><span className={styles.eyebrow}>Fixed workflow approach</span><h3>Rules live in the software.</h3><ul><li>One predefined review sequence.</li><li>Limited flexibility when policies change.</li><li>Policy changes may require software modifications.</li></ul></article><article className={styles.comparisonAccent}><span className={styles.eyebrow}>Configurable platform direction</span><h3>Policies shape the process.</h3><ul><li>Adjustable criteria, scales and weightages: backend supported.</li><li>Employment types and template targeting: backend supported.</li><li>Configurable review stages and sequences: planned.</li><li>Promotion modes and optional calibration: planned.</li></ul></article></div>
      <p className={styles.demoNote}>CorpDev 360 specializes in performance management. It is a responsive web application, not a replacement for a complete HRIS.</p>
    </div></section>
  );
}
