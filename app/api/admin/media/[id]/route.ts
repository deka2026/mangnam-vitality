import { NextRequest, NextResponse } from "next/server";
import { db, UPLOAD_DIR } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  const { caption } = await req.json().catch(() => ({}));
  db().prepare("UPDATE media SET caption=? WHERE id=?").run(caption || null, Number(params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  const row = db().prepare("SELECT filename FROM media WHERE id=?").get(Number(params.id)) as
    | { filename: string }
    | undefined;
  if (row) {
    const full = path.join(UPLOAD_DIR, row.filename);
    if (fs.existsSync(full)) fs.unlinkSync(full);
    db().prepare("DELETE FROM media WHERE id=?").run(Number(params.id));
  }
  return NextResponse.json({ ok: true });
}
