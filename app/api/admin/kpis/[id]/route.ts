import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  const { label, value, unit, note, sort } = await req.json().catch(() => ({}));
  db()
    .prepare("UPDATE kpis SET label=?, value=?, unit=?, note=?, sort=? WHERE id=?")
    .run(String(label), String(value), unit || null, note || null, Number(sort) || 0, Number(params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  db().prepare("DELETE FROM kpis WHERE id=?").run(Number(params.id));
  return NextResponse.json({ ok: true });
}
