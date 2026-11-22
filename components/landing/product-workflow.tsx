import FrameworkSample from "./framework-sample";
import styles from "./landing.module.css";

const workflows = [
  { name: "Self and Manager Review", steps: ["Self Review", "Manager Review", "Final"] },
  { name: "Multi-Reviewer Evaluation", steps: ["Self Review", "Peer Review", "Manager Review", "Calibration", "Final"] },
  { name: "Manager-Led Evaluation", steps: ["Manager Review", "Final"] },
];

export function ReviewWorkflows() {
  return (
    <section id="review-workflows" className={styles.workflowSection}>
      <div className={styles.container}>
        <div className={styles.heading}><span className={styles.eyebrow}>Configure your own review workflow · planned</span><h2>One platform. Different performance workflows.</h2><p>Different employee groups and organizations require different evaluation processes. The planned workflow configuration will match review stages and reviewer sequences to organizational policies.</p></div>
        <div className={styles.workflowExamples}>
          {workflows.map(workflow => (
            <article className={styles.workflowExample} key={workflow.name}><div className={styles.workflowExampleHeading}><h3>{workflow.name}</h3><span className={styles.plannedLabel}>Example workflow</span></div><ol className={styles.connectedSteps}>{workflow.steps.map((step, index) => <li key={step}><span className={step === "Calibration" || step === "Peer Review" ? styles.optionalStep : styles.processStep}>{step}{(step === "Calibration" || step === "Peer Review") && <small>Optional</small>}</span>{index < workflow.steps.length - 1 && <span className={styles.stepArrow} aria-hidden="true">→</span>}</li>)}</ol></article>
          ))}
        </div>
        <p className={styles.demoNote}>Conceptual examples, not executable workflows. Peer review and calibration are optional in the project scope. Dynamic stage configuration and review execution are not yet implemented.</p>
      </div>
    </section>
  );
}

const frameworkOptions = [
  ["Competency management", "Define technical and behavioural evaluation criteria."],
  ["KPI management", "Maintain measurable criteria and their scoring contributions."],
  ["Rating scales", "Choose a 1–3, 1–4 or 1–5 scale and customize labels."],
  ["Category weightages", "Set technical and behavioural scoring contributions."],
  ["Reusable templates", "Prepare review questions for relevant employee groups."],
  ["Reviewer weights", "Configure enabled reviewers and preview weighted calculations."],
];

export function PerformanceFramework() {
  return (
    <section id="framework" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}><span className={styles.eyebrow}>Performance framework configuration</span><h2>Build a performance framework that fits your organization.</h2><p>Define what performance means for each role and customize how employee contributions are evaluated.</p></div>
        <div className={styles.frameworkLayout}><div className={styles.optionGrid}>{frameworkOptions.map(([title, description], index) => <article key={title}><span className={styles.optionNumber}>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div><FrameworkSample /></div>
        <p className={styles.demoNote}>Framework configuration, scoring previews and template approval are backend-supported. Dedicated configuration screens are still in development.</p>
      </div>
    </section>
  );
}

const stages = [
  ["Configure the framework", "Competencies, KPIs, scales and weights.", "Backend supported"],
  ["Create the review cycle", "Draft manager cycles using approved templates.", "Backend supported · draft only"],
  ["Assign participants & reviewers", "Manager participants can be selected in draft cycles; reviewer assignment is planned.", "Partially supported"],
  ["Collect reviews & evidence", "Ratings, comments and supporting evidence.", "Planned"],
  ["Calculate performance scores", "Scoring previews are supported; final result processing is planned.", "Preview only"],
  ["Normalize where applicable", "Conditional, according to organization policy.", "Planned · conditional"],
  ["Calibrate or resolve disputes", "Optional review stages with documented decisions.", "Planned · conditional"],
  ["Finalize & recommend", "Finalize results and record eligible promotion recommendations.", "Planned"],
  ["Review reports & history", "Performance dashboards, reports and audit history.", "Planned"],
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.workflowSection}>
      <div className={styles.container}><div className={styles.heading}><span className={styles.eyebrow}>Performance lifecycle</span><h2>Manage the complete performance evaluation lifecycle.</h2><p>A connected product direction, with current availability marked at each stage. Normalization, calibration and disputes are conditional stages in the planned process.</p></div>
        <ol className={styles.lifecycleTimeline}>{stages.map(([title, description, status], index) => <li key={title}><span className={styles.stepNumber}>0{index + 1}</span><div><h3>{title}</h3><p>{description}</p><span className={status.startsWith("Planned") ? styles.plannedLabel : styles.capabilityLabel}>{status}</span></div></li>)}</ol>
        <p className={styles.demoNote}>Promotion recommendations are decision support, never automatic promotion approval or execution. This module is planned.</p>
      </div>
    </section>
  );
}

export function Governance() {
  return (
    <section id="security" className={styles.section}>
      <div className={styles.container}><div className={styles.heading}><span className={styles.eyebrow}>Security, governance & audit</span><h2>Built for controlled and traceable performance management.</h2><p>Verified access and configuration controls today, with broader performance history planned.</p></div>
        <div className={styles.grid}>{[["Role-based access", "Authenticated backend routes restrict administrative actions to authorized roles. Signing in does not grant access to every employee record."],["Separate template approvals", "HR can submit department-manager templates. An administrator approves or rejects them, with checks preventing approval of their own submission."],["Versioned configuration", "Framework and template snapshots capture configuration. Version checks help prevent newer changes from being overwritten."]].map(([title, text]) => <article className={styles.card} key={title}><h3>{title}</h3><p>{text}</p><span className={styles.capabilityLabel}>Backend supported</span></article>)}</div>
        <div className={styles.governanceNote}><strong>Planned governance controls</strong><p>Reviewer sequences, required rating evidence, calibration justifications, dispute records, score modification history, promotion history and administrative activity logs are not yet implemented.</p></div>
      </div>
    </section>
  );
}
