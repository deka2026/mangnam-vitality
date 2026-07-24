import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  const { kind, name, phone, email, message } = body;
  if (!name?.trim() || !phone?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "이름, 전화번호, 문의 내용은 필수입니다." },
      { status: 400 }
    );
  }
  db()
    .prepare(
      "INSERT INTO inquiries (kind, name, phone, email, message) VALUES (?,?,?,?,?)"
    )
    .run(
      ["방문", "사업", "기타"].includes(kind) ? kind : "기타",
      String(name).slice(0, 50),
      String(phone).slice(0, 30),
      email ? String(email).slice(0, 100) : null,
      String(message).slice(0, 3000)
    );
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  const rows = db()
    .prepare("SELECT * FROM inquiries ORDER BY id DESC LIMIT 200")
    .all();
  return NextResponse.json({ inquiries: rows });
}
