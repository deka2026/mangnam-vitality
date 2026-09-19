import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  db().prepare("DELETE FROM insta_contents WHERE id=?").run(Number(params.id));
  return NextResponse.json({ ok: true });
}

// 기존 콘텐츠 수정 (제목·본문·사진·인스타 링크)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = Number(params.id);
  const row = db().prepare("SELECT id FROM insta_contents WHERE id=?").get(id);
  if (!row) {
    return NextResponse.json({ error: "콘텐츠를 찾지 못했습니다." }, { status: 404 });
  }

  const { title, body, media_id, insta_url } = await req.json().catch(() => ({}));
  if (!title?.trim()) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }

  db()
    .prepare("UPDATE insta_contents SET title=?, body=?, media_id=?, insta_url=? WHERE id=?")
    .run(String(title).trim(), body || null, media_id || null, insta_url || null, id);

  return NextResponse.json({ ok: true });
}
