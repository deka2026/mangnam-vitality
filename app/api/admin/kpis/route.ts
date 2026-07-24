import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  return NextResponse.json({
    kpis: db().prepare("SELECT * FROM kpis ORDER BY sort, id").all(),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const { label, value, unit, note, sort } = await req.json().catch(() => ({}));
  if (!label?.trim() || !String(value ?? "").trim()) {
    return NextResponse.json({ error: "지표명과 값은 필수입니다." }, { status: 400 });
  }
  db()
    .prepare("INSERT INTO kpis (label, value, unit, note, sort) VALUES (?,?,?,?,?)")
    .run(String(label).trim(), String(value).trim(), unit || null, note || null, Number(sort) || 0);
  return NextResponse.json({ ok: true });
}
