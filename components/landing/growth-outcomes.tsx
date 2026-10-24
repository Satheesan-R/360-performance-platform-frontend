import styles from "./landing.module.css";

const questions = [
  ["What is CorpDev 360?", "CorpDev 360 is a configurable performance management platform designed for employee goals, review cycles, evaluations, scoring and performance governance. Onboarding is connected; frameworks, template approval, scoring previews and draft manager cycles are backend supported. The wider lifecycle remains in development."],
  ["Can organizations configure their own review workflows?", "Configurable review stages and reviewer sequences are part of the project direction, not working functionality today. The backend currently supports reviewer weights, review templates and template approval; the workflow diagrams show conceptual examples."],
  ["Which employee types are supported?", "The organization configuration supports internship, probationary and permanent employment types. Review templates can target employment types. Current draft cycles are limited to eligible department managers; internship, probation and annual cycle execution are planned."],
  ["How are performance scores calculated?", "The backend scoring preview applies configured criterion, technical and behavioural category weights, then combines enabled reviewer contributions using reviewer weights. It validates the required totals and selected rating scale. This is a preview; finalized employee results are not yet processed."],
  ["Does the platform automatically approve promotions?", "No. Promotion eligibility recommendations are planned, including threshold-based, matrix-based and discretionary modes, with interns excluded. No recommendations are generated today. Final promotion decisions will remain with the organization."],
  ["Is calibration mandatory?", "No. Calibration is an optional part of the project scope and is not implemented yet. The intended module would allow authorized adjustments with a recorded justification when enabled."],
  ["Can employees dispute their performance reviews?", "Not yet. Dispute submission, secondary review, resolution records and approved score updates are planned. There is no working dispute workflow in the current application."],
  ["Is CorpDev 360 a complete HR management system?", "No. CorpDev 360 focuses on employee performance management and does not replace a comprehensive HRIS. It is a responsive web application, not a payroll, attendance, recruitment or learning management system."],
  ["How is performance information controlled?", "Role-based permissions restrict authenticated backend actions to authorized users. Separate HR submission and administrator approval protect template configuration. Broader review, score-change and audit-history controls are planned; no external security certification is claimed."],
];

export default function GrowthOutcomes() {
  return (
    <section id="faq" className={styles.section}><div className={styles.container}>
      <div className={styles.heading}><span className={styles.eyebrow}>Frequently asked questions</span><h2>Know the process. Know what is available.</h2><p>Clear answers about configuration, roles and the product direction.</p></div>
      <div className={styles.faqList}>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    </div></section>
  );
}
