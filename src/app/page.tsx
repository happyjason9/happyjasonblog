import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          嗨，我是 <span className="text-gradient">Jason</span> 👋
        </h1>
        <p className={styles.subtitle}>
          我是一名軟體工程師，專注於打造兼具效能與質感的現代化個人網站體驗與系統架構設計。
        </p>
        <div className={styles.actions}>
          <Link href="/projects" className={styles.primaryBtn}>探索作品</Link>
          <Link href="/blog" className={styles.secondaryBtn}>閱讀文章</Link>
        </div>
      </header>

      <section className={styles.skillsSection}>
        <h2 className={styles.sectionTitle}>技術堆疊</h2>
        <div className={styles.skillsGrid}>
          {["React", "Next.js", "TypeScript", "Node.js", "UI/UX", "Python"].map(skill => (
            <div key={skill} className={`glass-panel ${styles.skillCard}`}>
              {skill}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
