import fs from "fs";
import path from "path";

/**
 * 문서 생성용 지식 베이스.
 *
 * data/knowledge/ 안의 .txt/.md 파일이 지식 원본이다 (사업 기본계획서 추출
 * 텍스트, 공동위키 망남 문서 등 — scripts/sync-knowledge.sh 로 채운다).
 * 공개 레포이므로 원문은 커밋하지 않고 서버의 data/ 에만 둔다.
 */

const KNOWLEDGE_DIR = path.join(
  process.env.DATA_DIR || path.join(process.cwd(), "data"),
  "knowledge"
);

export interface KnowledgeDoc {
  name: string;
  text: string;
}

// 키워드가 하나도 걸리지 않을 때 기본으로 넣는 핵심 문서 (우선순위 순)
const CORE_DOCS = [
  "위키-망남마을-기본계획-요약.md",
  "기본계획-01-추진배경및목적.txt",
  "기본계획-05-단위사업종합계획.txt",
  "기본계획-08-사업운영계획.txt",
];

export function knowledgeAvailable(): boolean {
  try {
    return fs.readdirSync(KNOWLEDGE_DIR).some((f) => /\.(txt|md)$/i.test(f));
  } catch {
    return false;
  }
}

function loadAll(): KnowledgeDoc[] {
  let files: string[];
  try {
    files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => /\.(txt|md)$/i.test(f));
  } catch {
    return [];
  }
  return files.map((f) => ({
    name: f.replace(/\.(txt|md)$/i, ""),
    text: fs.readFileSync(path.join(KNOWLEDGE_DIR, f), "utf-8"),
  }));
}

/**
 * 키워드와 관련 높은 지식 문서를 골라 총량 제한 안에서 반환한다.
 * @param query 키워드·제목·지시문을 합친 검색 문자열
 * @param maxChars 반환할 전체 텍스트 총량 상한
 */
export function selectKnowledge(query: string, maxChars = 60000): KnowledgeDoc[] {
  const docs = loadAll();
  if (!docs.length) return [];

  const terms = Array.from(
    new Set(
      query
        .split(/[\s,·、+/]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
    )
  );

  const scored = docs.map((d) => {
    let score = 0;
    for (const term of terms) {
      let idx = 0;
      let hits = 0;
      const lower = d.text;
      while ((idx = lower.indexOf(term, idx)) !== -1 && hits < 50) {
        hits++;
        idx += term.length;
      }
      score += hits;
      if (d.name.includes(term)) score += 20; // 파일명 일치 가중치
    }
    return { d, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const picked: KnowledgeDoc[] = [];
  let used = 0;
  const PER_DOC_CAP = 20000;

  const push = (d: KnowledgeDoc) => {
    if (picked.some((p) => p.name === d.name)) return;
    if (used >= maxChars) return;
    const text = d.text.slice(0, Math.min(PER_DOC_CAP, maxChars - used));
    picked.push({ name: d.name, text });
    used += text.length;
  };

  // 점수 있는 문서 우선, 이어서 핵심 문서로 바닥 채움
  for (const { d, score } of scored) if (score > 0) push(d);
  for (const name of CORE_DOCS) {
    const d = docs.find((x) => x.name === name.replace(/\.(txt|md)$/i, ""));
    if (d) push(d);
  }

  return picked;
}
