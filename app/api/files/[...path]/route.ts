import { NextRequest } from "next/server";
import { UPLOAD_DIR } from "@/lib/db";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const rel = params.path.join("/");
  const full = path.resolve(UPLOAD_DIR, rel);
  if (!full.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return new Response("잘못된 경로", { status: 400 });
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return new Response("없는 파일", { status: 404 });
  }
  const ext = path.extname(full).toLowerCase();
  const data = fs.readFileSync(full);
  return new Response(data, {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
