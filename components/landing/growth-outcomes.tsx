import styles from "./landing.module.css";
export default function GrowthOutcomes() {
  return <>
    <section className={styles.results} aria-label="Benefits for your team"><div className={`${styles.container} ${styles.resultGrid}`}>
      {[["01", "Clearer Goals", "Connect daily work to the outcomes that matter."], ["02", "Better Conversations", "Make timely feedback part of your team’s routine."], ["03", "Focused Growth", "Turn development opportunities into action."], ["04", "Shared Visibility", "Keep people and performance decisions connected."]].map(([number, title, description]) => <div key={title}><strong>{number}</strong><h3>{title}</h3><p>{description}</p></div>)}
    </div></section>
    <section className={styles.section}><div className={styles.container}>
      <div className={styles.quote}><span className={styles.quoteIcon} aria-hidden="true">“</span><div><span className={styles.eyebrow}>A better way to grow, together</span><blockquote>Great performance starts with clear expectations, meaningful feedback, and room to develop. Give your people a workspace that connects all three.</blockquote><small>The CorpDev 360 approach to team development</small></div></div>
      <div className={styles.faq}><h3>A few things you might be wondering</h3><details><summary>How do I access my workspace?</summary><p>Click Employee Login or Get Started to open the login page. Use the credentials associated with your organization&apos;s account.</p></details><details><summary>Who is CorpDev 360 built for?</summary><p>The platform brings employees, managers, and HR teams together around goals, feedback, performance reviews, and career development.</p></details><details><summary>Do I need to log in to explore this page?</summary><p>You can explore this overview without an account. Your personal workspace and organizational information require sign-in.</p></details></div>
    </div></section>
  </>;
}
