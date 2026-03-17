import { Metadata } from "next";
import styles from "./page.module.css";
import BBoxAnnotator from "./BBoxAnnotator";

export const metadata: Metadata = {
  title: "標注工具 | Jason",
  description: "Bounding Box 圖片標注工具，支援匯出 JSON",
};

export default function BBoxAnnotatorPage() {
  return (
    <div className={styles.container}>
      <BBoxAnnotator />
    </div>
  );
}
