import styles from "./landing.module.css";

export default function FrameworkSample() {
  return (
    <figure className={styles.frameworkSample}>
      <figcaption><span className={styles.eyebrow}>Conceptual illustration</span><h3>A shared definition of performance.</h3><p>Sample configuration data · not an application screenshot or employee result.</p></figcaption>
      <dl className={styles.sampleFields}>
        <div><dt>Technical competency</dt><dd>Problem solving</dd></div>
        <div><dt>KPI / evaluation criterion</dt><dd>Delivery against agreed milestones</dd></div>
        <div><dt>Rating scale</dt><dd>1–5</dd></div>
        <div><dt>Competency category weights</dt><dd>Technical 60% · Behavioural 40%</dd></div>
        <div><dt>Example reviewer rating</dt><dd>Manager · 4 / 5</dd></div>
      </dl>
      <p className={styles.sampleFootnote}>Category weights and an individual rating are illustrated separately. This is not a calculated overall score.</p>
    </figure>
  );
}
