import Link from "next/link";
import { getAllPostsMeta } from "@/lib/mdx";
import styles from "./page.module.css";

export default function Blog() {
  const posts = getAllPostsMeta();

  return (
    <div className={styles.blogContainer}>
      <h1 className={styles.pageTitle}>部落格文章</h1>
      <p className={styles.pageSubtitle}>關於開發筆記、技術分享與生活隨筆</p>
      
      <div className={styles.postList}>
        {posts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className={`glass-panel ${styles.postCard}`}>
            <h2>{post.title}</h2>
            <div className={styles.postMeta}>
              <time>{post.date}</time>
            </div>
            <p className={styles.postExcerpt}>{post.excerpt}</p>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className={styles.emptyState}>目前還沒有文章喔。</p>
        )}
      </div>
    </div>
  );
}
