import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { aiEnabled, generatePostFromReport, HpcError } from "@/lib/ai";
import { pdfToText } from "@/lib/extract";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// 사업결과보고서(텍스트/PDF)를 받아 블로그형 홍보글 초안을 생성한다.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!aiEnabled()) {
    return NextResponse.json(
      {
        error:
          "AI 생성 기능(사교원 HPC 엔진 연결)을 쓸 수 없습니다. 아래 편집기에서 직접 작성해 주세요.",
      },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const text = (form.get("text") as string) || "";
  const file = form.get("file") as File | null;

  let fileText = "";
  let filename: string | undefined;

  if (file && file.size > 0) {
    filename = file.name;
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: "파일이 너무 큽니다 (30MB 이하)." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const t = pdfToText(buf);
      if (!t) {
        return NextResponse.json(
          { error: "PDF 에서 글자를 읽지 못했습니다(스캔본일 수 있음). 내용을 복사해 붙여넣어 주세요." },
          { status: 400 }
        );
      }
      fileText = t;
    } else if (/\.(txt|md|csv)$/i.test(file.name)) {
      fileText = buf.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "PDF 또는 텍스트(.txt/.md) 파일만 지원합니다. 한글(HWP)·워드 파일은 내용을 복사해 붙여넣어 주세요." },
        { status: 400 }
      );
    }
  }

  const combined = [text, fileText].filter(Boolean).join("\n\n");
  if (!combined.trim()) {
    return NextResponse.json({ error: "보고서 내용 또는 파일을 넣어 주세요." }, { status: 400 });
  }

  try {
    const draft = await generatePostFromReport({ text: combined, filename });
    return NextResponse.json({ draft, source_report: filename ?? null });
  } catch (err) {
    if (err instanceof HpcError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("generate post failed:", (err as Error)?.message);
    return NextResponse.json(
      { error: "AI 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
