"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostMeta } from "@/lib/mdx";
import styles from "./BlogList.module.css";

export default function BlogList({ posts }: { posts: PostMeta[] }) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags ?? [])));

  const filtered = posts.filter((post) => {
    const matchSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || (post.tags ?? []).includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="搜尋文章..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        {allTags.length > 0 && (
          <div className={styles.tagRow}>
            <button
              onClick={() => setActiveTag("")}
              className={`${styles.tag} ${!activeTag ? styles.activeTag : ""}`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? "" : tag)}
                className={`${styles.tag} ${tag === activeTag ? styles.activeTag : ""}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.postList}>
        {filtered.map((post) => (
          <Link
            href={`/blog/${post.slug}`}
            key={post.slug}
            className={`glass-panel ${styles.postCard}`}
          >
            <h2>{post.title}</h2>
            <div className={styles.postMeta}>
              <time>{post.date}</time>
              {(post.tags ?? []).length > 0 && (
                <div className={styles.postTags}>
                  {(post.tags ?? []).map((t) => (
                    <span key={t} className={styles.postTag}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className={styles.postExcerpt}>{post.excerpt}</p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className={styles.emptyState}>找不到符合的文章。</p>
        )}
      </div>
    </>
  );
}
