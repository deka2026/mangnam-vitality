import { NextRequest, NextResponse } from "next/server";
import { db, getSetting, setSetting } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  return NextResponse.json({
    contents: db()
      .prepare(
        `SELECT ic.*, m.filename, m.kind FROM insta_contents ic
         LEFT JOIN media m ON m.id = ic.media_id ORDER BY ic.id DESC LIMIT 100`
      )
      .all(),
    media: db().prepare("SELECT id, kind, filename, caption FROM media ORDER BY id DESC LIMIT 100").all(),
    insta_account: getSetting("insta_account"),
    ics_url: getSetting("ics_url"),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const { title, body, media_id, insta_url } = await req.json().catch(() => ({}));
  if (!title?.trim()) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }
  db()
    .prepare("INSERT INTO insta_contents (title, body, media_id, insta_url) VALUES (?,?,?,?)")
    .run(String(title).trim(), body || null, media_id || null, insta_url || null);
  return NextResponse.json({ ok: true });
}

// 설정 저장 (인스타 계정, 캘린더 ICS 주소)
export async function PUT(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const { insta_account, ics_url } = await req.json().catch(() => ({}));
  if (insta_account !== undefined) setSetting("insta_account", String(insta_account).trim());
  if (ics_url !== undefined) setSetting("ics_url", String(ics_url).trim());
  return NextResponse.json({ ok: true });
}
