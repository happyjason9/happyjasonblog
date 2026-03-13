import styles from "./page.module.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "專案作品集 | Jason",
  description: "這裡收集了我過去參與與主導的 side projects",
};

const projects = [
  {
    title: "AI 影片靜音剪輯工具",
    description: "基於 React 建置的本地端影片處理服務，能自動偵測音檔的無聲片段並進行裁切。",
    tags: ["React", "TypeScript", "Web Audio API"],
    link: "https://github.com/Jason"
  },
  {
    title: "電商平台管理後台",
    description: "使用 Next.js 與 Server Actions 打造的高效能商品管理系統。",
    tags: ["Next.js", "Tailwind CSS", "Prisma"],
    link: "https://github.com/Jason"
  },
  {
    title: "個人技術部落格",
    description: "純 CSS 結合 MDX 技術打造的高效能靜態部落格，部署於 Cloudflare Pages。",
    tags: ["Next.js", "CSS Modules", "MDX"],
    link: "https://github.com/Jason"
  }
];

export default function Projects() {
  return (
    <div className={styles.projectsContainer}>
      <h1 className={styles.pageTitle}>專案作品集</h1>
      <p className={styles.pageSubtitle}>這裡收集了我過去參與與主導的 side projects</p>
      
      <div className={styles.grid}>
        {projects.map((project, index) => (
          <a key={index} href={project.link} target="_blank" rel="noopener noreferrer" className={`glass-panel ${styles.card}`}>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <div className={styles.tags}>
              {project.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
