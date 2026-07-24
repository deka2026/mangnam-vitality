import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  const rows = db().prepare("SELECT * FROM posts ORDER BY id DESC LIMIT 100").all();
  return NextResponse.json({ posts: rows });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const { title, summary, content, published, source_report } = await req
    .json()
    .catch(() => ({}));
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 본문은 필수입니다." }, { status: 400 });
  }
  const info = db()
    .prepare(
      "INSERT INTO posts (title, summary, content, published, source_report) VALUES (?,?,?,?,?)"
    )
    .run(
      String(title).trim(),
      summary ? String(summary).trim() : null,
      String(content),
      published === false ? 0 : 1,
      source_report ?? null
    );
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
