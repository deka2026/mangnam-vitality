import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 문서 목록 */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  const docs = db()
    .prepare("SELECT * FROM docs ORDER BY id DESC")
    .all();
  return NextResponse.json({ docs });
}

/** 직접 작성한 문서 저장 (AI 미사용) */
export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body?.title?.trim() || !body?.content?.trim()) {
    return NextResponse.json({ error: "제목과 본문을 입력해 주세요." }, { status: 400 });
  }
  const info = db()
    .prepare(
      "INSERT INTO docs (doc_type, title, subtitle, keywords, content) VALUES (?,?,?,?,?)"
    )
    .run(
      body.doc_type || "자유양식",
      body.title.trim(),
      body.subtitle ?? null,
      body.keywords ?? null,
      body.content
    );
  const doc = db().prepare("SELECT * FROM docs WHERE id=?").get(info.lastInsertRowid);
  return NextResponse.json({ doc });
}
