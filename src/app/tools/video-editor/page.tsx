import { Metadata } from "next";
import VideoEditor from "@/components/features/VideoEditor/VideoEditor";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "影音剪輯器 | Jason 小工具",
  description: "瀏覽器內影音剪輯工具，支援裁切、文字疊加與導出 WebM。全程本地端處理。",
};

export default function VideoEditorPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🎬 影音剪輯器</h1>
        <p className={styles.pageSubtitle}>
          裁切片段 · 疊加文字 · 導出 WebM — 全程本地端，不上傳任何檔案
        </p>
      </div>
      <VideoEditor />
    </div>
  );
}
