import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

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
