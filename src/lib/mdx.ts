import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content/blog');

export type PostMeta = {
  title: string;
  date: string;
  excerpt: string;
  slug: string;
};

export const getPostBySlug = (slug: string) => {
  const realSlug = slug.replace(/\.mdx?$/, '');
  const fullPathTsx = path.join(contentDirectory, `${realSlug}.mdx`);
  const fullPathMd = path.join(contentDirectory, `${realSlug}.md`);
  
  let fileContents;
  try {
    if (fs.existsSync(fullPathTsx)) {
      fileContents = fs.readFileSync(fullPathTsx, 'utf8');
    } else {
      fileContents = fs.readFileSync(fullPathMd, 'utf8');
    }
  } catch (e) {
    return null;
  }

  const { data, content } = matter(fileContents);

  return {
    meta: { ...data, slug: realSlug } as PostMeta,
    content,
  };
};

export const getAllPostsMeta = (): PostMeta[] => {
  if (!fs.existsSync(contentDirectory)) return [];
  const files = fs.readdirSync(contentDirectory);
  const posts = files
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => getPostBySlug(file))
    .filter((post) => post !== null)
    .map((post) => post!.meta)
    .sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
  
  return posts;
};
