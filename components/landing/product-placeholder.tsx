import styles from "./landing.module.css";

export default function ProductPlaceholder({ title, compact = false }: { title: string; compact?: boolean }) {
  return <div className={compact ? styles.compactPlaceholder : styles.productPlaceholder}>
    <span className={styles.placeholderMark} aria-hidden="true">▧</span>
    <span className={styles.eyebrow}>Screenshot placeholder</span>
    <h3>{title}</h3>
    <p>A real application screenshot will appear here. No product screen or company data is simulated.</p>
  </div>;
}
