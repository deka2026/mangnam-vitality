import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

// 정적(홍보판) 빌드에서 시드된 소식 글을 미리 생성 (서버 모드에선 force-dynamic이 우선)
export function generateStaticParams() {
  if (process.env.STATIC_EXPORT !== "1") return [];
  const posts = db()
    .prepare("SELECT id FROM posts WHERE published=1")
    .all() as { id: number }[];
  return posts.map((p) => ({ id: String(p.id) }));
}

interface Post {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  created_at: string;
}

export default function PostPage({ params }: { params: { id: string } }) {
  const post = db()
    .prepare("SELECT * FROM posts WHERE id=? AND published=1")
    .get(Number(params.id)) as Post | undefined;
  if (!post) notFound();

  return (
    <article className="container-page py-14 max-w-3xl">
      <Link href="/news" className="text-sm text-sea-600 hover:underline">
        ← 사업소식 목록
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-sea-800">{post.title}</h1>
      <p className="mt-2 text-sm text-sea-500">{post.created_at.slice(0, 10)}</p>
      {post.summary && (
        <p className="mt-4 rounded-xl bg-sea-50 p-4 text-sm text-sea-700 ring-1 ring-sea-100">
          {post.summary}
        </p>
      )}
      <div
        className="prose-post mt-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />
    </article>
  );
}
