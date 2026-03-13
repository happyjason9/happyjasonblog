import { getAllPostsMeta } from "@/lib/mdx";
import styles from "./page.module.css";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import BlogList from "@/components/BlogList/BlogList";

export default function Blog() {
  const posts = getAllPostsMeta();

  return (
    <div className={styles.blogContainer}>
      <ScrollReveal>
        <h1 className={styles.pageTitle}>部落格文章</h1>
        <p className={styles.pageSubtitle}>關於開發筆記、技術分享與生活隨筆</p>
      </ScrollReveal>

      <BlogList posts={posts} />
    </div>
  );
}
