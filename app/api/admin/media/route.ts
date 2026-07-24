import { NextRequest, NextResponse } from "next/server";
import { db, UPLOAD_DIR } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const VIDEO_EXT = [".mp4", ".webm", ".mov"];

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  return NextResponse.json({
    media: db().prepare("SELECT * FROM media ORDER BY id DESC LIMIT 200").all(),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const files = form.getAll("files") as File[];
  const caption = (form.get("caption") as string) || null;
  if (!files.length) {
    return NextResponse.json({ error: "파일을 선택해 주세요." }, { status: 400 });
  }

  const saved: number[] = [];
  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    const kind = IMAGE_EXT.includes(ext) ? "image" : VIDEO_EXT.includes(ext) ? "video" : null;
    if (!kind) continue;
    if (file.size > 200 * 1024 * 1024) continue;
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    const info = db()
      .prepare("INSERT INTO media (kind, filename, original_name, caption) VALUES (?,?,?,?)")
      .run(kind, name, file.name, caption);
    saved.push(Number(info.lastInsertRowid));
  }
  if (!saved.length) {
    return NextResponse.json(
      { error: "지원하는 파일이 없습니다. (이미지: jpg/png/gif/webp, 영상: mp4/webm/mov, 200MB 이하)" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, ids: saved });
}
