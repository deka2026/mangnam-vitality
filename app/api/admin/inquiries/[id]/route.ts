import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  const { answer } = await req.json().catch(() => ({}));
  if (typeof answer !== "string" || !answer.trim()) {
    return NextResponse.json({ error: "답변 내용을 입력해 주세요." }, { status: 400 });
  }
  db()
    .prepare(
      "UPDATE inquiries SET answer=?, answered_at=datetime('now','localtime') WHERE id=?"
    )
    .run(answer.trim(), Number(params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  db().prepare("DELETE FROM inquiries WHERE id=?").run(Number(params.id));
  return NextResponse.json({ ok: true });
}
