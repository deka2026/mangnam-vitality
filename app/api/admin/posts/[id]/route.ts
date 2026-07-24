import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const id = Number(params.id);
  const cur = db().prepare("SELECT * FROM posts WHERE id=?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!cur) return NextResponse.json({ error: "없는 글입니다." }, { status: 404 });

  db()
    .prepare(
      "UPDATE posts SET title=?, summary=?, content=?, published=? WHERE id=?"
    )
    .run(
      body.title !== undefined ? String(body.title) : (cur.title as string),
      body.summary !== undefined ? (body.summary ? String(body.summary) : null) : (cur.summary as string | null),
      body.content !== undefined ? String(body.content) : (cur.content as string),
      body.published !== undefined ? (body.published ? 1 : 0) : (cur.published as number),
      id
    );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  db().prepare("DELETE FROM posts WHERE id=?").run(Number(params.id));
  return NextResponse.json({ ok: true });
}
