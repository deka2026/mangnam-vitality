import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { aiEnabled, generateDocument, DOC_TYPES } from "@/lib/claude";
import { extractRef, ExtractedRef } from "@/lib/extract";
import { selectKnowledge, knowledgeAvailable } from "@/lib/knowledge";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * 기획안·보고서 자동 작성.
 * 사업 지식 자료(data/knowledge/) + 업로드 참고자료(자료 요청 공문 등) +
 * 키워드를 바탕으로 Claude 가 행정 문서 초안을 만들어 docs 에 저장한다.
 */
export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  if (!aiEnabled()) {
    return NextResponse.json(
      {
        error:
          "AI 생성 기능이 아직 설정되지 않았습니다 (ANTHROPIC_API_KEY 필요). '직접 작성'으로 문서를 만들면 한글파일 변환은 그대로 쓸 수 있습니다.",
      },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const docType = (form.get("doc_type") as string) || "기획안";
  const title = ((form.get("title") as string) || "").trim();
  const keywords = ((form.get("keywords") as string) || "").trim();
  const instructions = ((form.get("instructions") as string) || "").trim();
  const pasted = ((form.get("text") as string) || "").trim();

  if (!(docType in DOC_TYPES)) {
    return NextResponse.json({ error: "알 수 없는 문서 종류입니다." }, { status: 400 });
  }
  if (!title && !keywords && !instructions && !pasted && !form.getAll("files").length) {
    return NextResponse.json(
      { error: "제목·키워드·지시사항 중 하나는 입력하거나 참고자료를 올려 주세요." },
      { status: 400 }
    );
  }

  // 업로드 참고자료 텍스트 추출
  const refs: ExtractedRef[] = [];
  for (const entry of form.getAll("files")) {
    const file = entry as File;
    if (!file || !file.size) continue;
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: `${file.name}: 파일이 너무 큽니다 (30MB 이하).` }, { status: 400 });
    }
    try {
      refs.push(await extractRef(file));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }
  if (pasted) refs.push({ name: "붙여넣은 내용", text: pasted });

  // 지식 자료 선별 (키워드·제목 기준)
  const knowledge = selectKnowledge([title, keywords, instructions, docType].join(" "));

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  try {
    const draft = await generateDocument({
      docType,
      title: title || undefined,
      keywords: keywords || undefined,
      instructions: instructions || undefined,
      refs,
      knowledge,
      today,
    });

    const info = db()
      .prepare(
        "INSERT INTO docs (doc_type, title, subtitle, keywords, content, source_files, knowledge_used) VALUES (?,?,?,?,?,?,?)"
      )
      .run(
        docType,
        draft.title,
        draft.subtitle,
        keywords || null,
        draft.content,
        JSON.stringify(refs.map((r) => r.name)),
        JSON.stringify(knowledge.map((k) => k.name))
      );
    const doc = db().prepare("SELECT * FROM docs WHERE id=?").get(info.lastInsertRowid);
    return NextResponse.json({ doc, knowledge_available: knowledgeAvailable() });
  } catch (err) {
    console.error("generate document failed:", err);
    return NextResponse.json(
      { error: "AI 문서 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
