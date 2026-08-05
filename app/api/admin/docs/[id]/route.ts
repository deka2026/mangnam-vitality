import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 문서 수정 (제목·부제·본문·종류) */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const existing = db().prepare("SELECT * FROM docs WHERE id=?").get(params.id);
  if (!existing) return NextResponse.json({ error: "문서를 찾을 수 없습니다." }, { status: 404 });

  db()
    .prepare(
      `UPDATE docs SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        doc_type = COALESCE(?, doc_type),
        content = COALESCE(?, content),
        updated_at = datetime('now','localtime')
       WHERE id = ?`
    )
    .run(body.title ?? null, body.subtitle ?? null, body.doc_type ?? null, body.content ?? null, params.id);
  const doc = db().prepare("SELECT * FROM docs WHERE id=?").get(params.id);
  return NextResponse.json({ doc });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  db().prepare("DELETE FROM docs WHERE id=?").run(params.id);
  return NextResponse.json({ ok: true });
}
