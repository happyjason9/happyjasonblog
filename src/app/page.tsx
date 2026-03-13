"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";

const TITLE_TEXT = "嗨，我是 Jason 👋";

const skills = [
  { name: "React", icon: "⚛️" },
  { name: "Next.js", icon: "🔺" },
  { name: "TypeScript", icon: "📘" },
  { name: "Node.js", icon: "🟢" },
  { name: "UI/UX", icon: "🎨" },
  { name: "Python", icon: "🐍" },
];

export default function Home() {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < TITLE_TEXT.length) {
        setDisplayed(TITLE_TEXT.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.homeContainer}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          {displayed}
          <span className={`${styles.cursor} ${done ? styles.cursorBlink : ""}`}>
            |
          </span>
        </h1>
        <p className={styles.subtitle}>
          我是一名軟體工程師，專注於打造兼具效能與質感的現代化個人網站體驗與系統架構設計。
        </p>
        <div className={styles.actions}>
          <Link href="/projects" className={styles.primaryBtn}>探索作品</Link>
          <Link href="/blog" className={styles.secondaryBtn}>閱讀文章</Link>
        </div>
      </header>

      <ScrollReveal>
        <section className={styles.skillsSection}>
          <h2 className={styles.sectionTitle}>技術堆疊</h2>
          <div className={styles.skillsGrid}>
            {skills.map((skill, i) => (
              <ScrollReveal key={skill.name} delay={i * 80} direction="up">
                <div className={`glass-panel ${styles.skillCard}`}>
                  <span className={styles.skillIcon}>{skill.icon}</span>
                  <span>{skill.name}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
