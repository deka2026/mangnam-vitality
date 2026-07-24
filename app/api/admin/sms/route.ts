import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { sendSms, smsConfigured } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  return NextResponse.json({
    configured: smsConfigured(),
    log: db().prepare("SELECT * FROM sms_log ORDER BY id DESC LIMIT 50").all(),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const { recipients, message } = await req.json().catch(() => ({}));
  if (!Array.isArray(recipients) || !recipients.length) {
    return NextResponse.json({ error: "받는 사람을 선택해 주세요." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "문자 내용을 입력해 주세요." }, { status: 400 });
  }
  const list = recipients as { name: string; phone: string }[];
  const result = await sendSms(list.map((r) => r.phone), message.trim());

  db()
    .prepare("INSERT INTO sms_log (recipients, message, status, detail) VALUES (?,?,?,?)")
    .run(JSON.stringify(list), message.trim(), result.status, result.detail);

  if (result.status === "failed") {
    return NextResponse.json({ error: result.detail }, { status: 502 });
  }
  return NextResponse.json({ ok: true, status: result.status, detail: result.detail });
}
