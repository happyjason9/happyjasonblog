import { Metadata } from "next";
import styles from "./page.module.css";
import ImageCompareTool from "./ImageCompareTool";

export const metadata: Metadata = {
  title: "圖片比較工具 | Jason",
  description: "雙圖同步放大鏡比較工具，上傳兩張圖片後移動滑鼠即可同步對比細節",
};

export default function ImageComparePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>圖片比較工具</h1>
      <p className={styles.subtitle}>
        上傳兩張圖片，移動滑鼠即可同步放大鏡對比細節
      </p>
      <ImageCompareTool />
    </div>
  );
}
