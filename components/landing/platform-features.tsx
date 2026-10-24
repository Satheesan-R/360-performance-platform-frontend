import styles from "./landing.module.css";

const features = [
  ["01", "Organization & Employee Management", "Manage employee profiles and invitations in the application. Departments, teams, employment types and reporting hierarchies are supported by backend endpoints.", "Available / backend supported"],
  ["02", "Goals & OKRs", "Planned organization, team and individual goals with progress tracking and alignment.", "Planned"],
  ["03", "Performance Review Cycles", "The backend creates draft department-manager cycles with dates, selected participants and an approved template snapshot. Broader cycle execution is planned.", "Backend supported · limited scope"],
  ["04", "Configurable Review Workflows", "Planned review stages and reviewer sequences, including optional peer review and calibration. A dynamic workflow builder is not available today.", "Planned"],
  ["05", "Performance Frameworks", "Configure competencies, KPIs, rating scales, category weights and reusable templates through the backend.", "Backend supported"],
  ["06", "Performance Scoring", "Preview reviewer-weighted scores using configured competency and KPI weights. Final review-result processing is not yet connected.", "Scoring preview supported"],
  ["07", "Normalization & Promotion Recommendations", "Planned configurable normalization and promotion eligibility recommendations. No promotion recommendation is currently generated.", "Planned"],
  ["08", "Calibration & Dispute Resolution", "Planned optional calibration, justified score adjustments and structured dispute outcomes.", "Planned"],
  ["09", "Dashboards, Notifications & Audit Trails", "Role-based dashboard routes and onboarding emails are available. Performance reporting, review reminders and consolidated audit trails are planned.", "Partially available"],
];

export default function PlatformFeatures() {
  return (
    <section id="platform" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}><span className={styles.eyebrow}>The performance platform</span><h2>Everything you need to manage performance.</h2><p>Manage the performance evaluation lifecycle, from organizational goals and review cycles to scoring, governance, and final outcomes.</p></div>
        <div className={styles.scopeLegend}><span>Available: connected application functionality</span><span>Backend supported: management screens may be pending</span><span>Planned: not available yet</span></div>
        <div className={styles.grid}>
          {features.map(([number, title, description, status]) => (
            <article className={styles.card} key={title}><span className={styles.icon} aria-hidden="true">{number}</span><h3>{title}</h3><p>{description}</p><span className={status === "Planned" ? styles.plannedLabel : styles.capabilityLabel}>{status}</span></article>
          ))}
        </div>
      </div>
    </section>
  );
}
