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
      <ImageCompareTool />
    </div>
  );
}
