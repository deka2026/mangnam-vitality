import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { db } from "@/lib/db";
import { buildHwpx } from "@/lib/hwpx";

export const dynamic = "force-dynamic";

interface DocRow {
  id: number;
  title: string;
  subtitle: string | null;
  content: string;
  created_at: string;
}

/** 문서를 한글(HWPX) 파일로 변환해 내려준다 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  const doc = db().prepare("SELECT * FROM docs WHERE id=?").get(params.id) as DocRow | undefined;
  if (!doc) return NextResponse.json({ error: "문서를 찾을 수 없습니다." }, { status: 404 });

  const buf = buildHwpx({
    title: doc.title,
    subtitle: doc.subtitle ?? undefined,
    markdown: doc.content,
  });

  const safeName = doc.title.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "문서";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="doc-${doc.id}.hwpx"; filename*=UTF-8''${encodeURIComponent(safeName)}.hwpx`,
      "Content-Length": String(buf.length),
    },
  });
}
