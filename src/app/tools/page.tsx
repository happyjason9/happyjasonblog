import styles from "./page.module.css";
import { Metadata } from "next";
import TiltCard from "@/components/ui/TiltCard/TiltCard";
import ScrollReveal from "@/components/ui/ScrollReveal/ScrollReveal";

export const metadata: Metadata = {
  title: "小工具 | Jason",
  description: "一些實用的線上小工具",
};

const tools = [
  {
    title: "圖片比較工具",
    description: "雙圖同步放大鏡比較，上傳兩張圖片後移動滑鼠即可對比細節差異。",
    tags: ["圖片", "比較", "放大鏡"],
    link: "/tools/image-compare",
    emoji: "🔬",
    internal: true,
  },
  {
    title: "JSON 格式化工具",
    description: "快速格式化、壓縮、驗證 JSON 資料，支援語法高亮顯示。",
    tags: ["JSON", "格式化", "開發工具"],
    link: "https://jsonformatter.curiousconcept.com/",
    emoji: "📋",
  },
  {
    title: "正則表達式測試",
    description: "即時測試與除錯正則表達式，提供詳細的匹配說明。",
    tags: ["Regex", "測試", "開發工具"],
    link: "https://regex101.com/",
    emoji: "🔍",
  },
  {
    title: "顏色選擇器",
    description: "線上顏色工具，支援 HEX、RGB、HSL 格式轉換與調色盤生成。",
    tags: ["CSS", "顏色", "設計工具"],
    link: "https://coolors.co/",
    emoji: "🎨",
  },
  {
    title: "Base64 編解碼",
    description: "快速將文字或檔案進行 Base64 編碼與解碼。",
    tags: ["Base64", "編碼", "開發工具"],
    link: "https://www.base64encode.org/",
    emoji: "🔐",
  },
  {
    title: "Cron 表達式產生器",
    description: "視覺化設定 Cron 排程，自動生成對應的 Cron 表達式。",
    tags: ["Cron", "排程", "開發工具"],
    link: "https://crontab.guru/",
    emoji: "⏰",
  },
  {
    title: "圖片壓縮工具",
    description: "免費線上壓縮 PNG、JPEG、WebP 圖片，不損失畫質。",
    tags: ["圖片", "壓縮", "優化"],
    link: "https://squoosh.app/",
    emoji: "🖼️",
  },
];

export default function Tools() {
  return (
    <div className={styles.toolsContainer}>
      <ScrollReveal>
        <h1 className={styles.pageTitle}>小工具</h1>
        <p className={styles.pageSubtitle}>收集常用的線上工具，提升開發與日常效率</p>
      </ScrollReveal>

      <div className={styles.grid}>
        {tools.map((tool, index) => (
          <ScrollReveal key={index} delay={index * 100}>
            <TiltCard
              className={`glass-panel ${styles.card}`}
              href={tool.link}
              target={tool.internal ? undefined : "_blank"}
              rel={tool.internal ? undefined : "noopener noreferrer"}
            >
              <div className={styles.emoji}>{tool.emoji}</div>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
              <div className={styles.tags}>
                {tool.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
