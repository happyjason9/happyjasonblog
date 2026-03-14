import { getPostBySlug, getAllPostsMeta } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import { Metadata } from "next";
import ReadingProgress from "@/components/features/ReadingProgress/ReadingProgress";

export async function generateStaticParams() {
  const posts = getAllPostsMeta();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.meta.title} | Jason的部落格`,
    description: post.meta.excerpt,
    openGraph: {
      title: post.meta.title,
      description: post.meta.excerpt,
      type: "article",
      publishedTime: post.meta.date,
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  return (
    <article className={styles.articleContainer}>
      <ReadingProgress />
      <Link href="/blog" className={styles.backLink}>← 返回文章列表</Link>
      <header className={styles.header}>
        <h1 className={styles.title}>{post.meta.title}</h1>
        <time className={styles.date}>{post.meta.date}</time>
      </header>
      <div className={styles.content}>
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
