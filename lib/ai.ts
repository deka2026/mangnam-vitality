import { callHpc, hpcAvailable, HpcError } from "./hpc";

/**
 * 관리자 AI 초안(홍보글·행정문서·인스타 스토리) — 2026-11-21 이사장 결정으로
 * Anthropic 직행을 끊고 사교원 HPC 길잡이(hpc_route.연산, 외부 AI 폴백 없음)로 보낸다.
 * 자료는 개인정보를 가린 뒤 보내고, 가려지지 않는 개인정보가 있으면 보내지 않는다(422).
 */

export function aiEnabled(): boolean {
  return hpcAvailable();
}

export { HpcError };

export interface GeneratedPost {
  title: string;
  summary: string;
  content: string; // markdown
}

export interface GeneratedDoc {
  title: string;
  subtitle: string; // 제목 아래 한 줄 (작성일·작성 주체)
  content: string; // markdown
}

/** 엔진 답 「제목: … / 요약(부제): … / 본문: …」 를 나눈다(**제목:**·## 제목: 처럼 꾸민 꼴도 받는다) */
function parseLabeled(answer: string, second: "요약" | "부제") {
  const t = answer.replace(/\r/g, "").replace(/\n?\s*\[자료 끝\]\s*$/, "");
  const label = (name: string) => new RegExp(`^[ \\t#*]*${name}[ \\t*]*[:：][ \\t*]*(.*)$`, "m");
  const clean = (v: string) => v.trim().replace(/^[#*\s]+|[*\s]+$/g, "");
  const tm = t.match(label("제목"));
  const sm = t.match(label(second));
  const bm = t.match(label("본문"));
  const title = clean(tm?.[1] ?? "");
  const sub = clean(sm?.[1] ?? "");
  let content = "";
  if (bm && bm.index !== undefined) {
    content = (bm[1] + "\n" + t.slice(bm.index + bm[0].length)).trim();
  } else {
    // 「본문:」 이름표 없이 이어 쓴 답 — 제목·요약(부제) 줄 다음부터
    const last = [tm, sm].filter((m) => m && m.index !== undefined).sort((a, b) => b!.index! - a!.index!)[0];
    if (last) content = t.slice(last.index! + last[0].length).trim();
  }
  if (!title || !content) throw new Error("AI 엔진 답의 형식이 맞지 않습니다. 다시 시도해 주세요.");
  return { title, sub, content };
}

const ANSWER_FORMAT_POST = `답은 아래 형식 그대로, 다른 말 없이 쓴다.
제목: (한 줄)
요약: (한 줄, 2문장)
본문:
(마크다운 본문 여러 줄)`;

const ANSWER_FORMAT_DOC = `답은 아래 형식 그대로, 다른 말 없이 쓴다.
제목: (한 줄)
부제: (한 줄)
본문:
(마크다운 본문 여러 줄)`;

const POST_SYSTEM = `너는 전남광주통합특별시 완도군 망남생활권 어촌신활력증진사업의 홍보 담당자다.
사업결과보고서를 받아 마을 주민과 일반 방문객이 읽기 좋은 블로그형 홍보글을 한국어로 작성한다.
- 따뜻하고 친근한 어조, 과장 없이 사실에 근거
- 마크다운 형식 (## 소제목, 목록 활용), 800~1500자
- 제목: 눈길을 끄는 제목 (30자 이내), 요약: 2문장 요약
- 본문: 배경 → 활동 내용 → 성과 → 앞으로의 계획 흐름
- 자료의 「(생략)」은 개인정보를 지운 자리다. 지어내 채우지 않는다.`;

const POST_INPUT_MAX = 8000;

/** 보고서 글에서 블로그형 홍보글 생성 (PDF 는 부른 쪽이 글자로 바꿔 넘긴다) */
export async function generatePostFromReport(input: { text: string; filename?: string }): Promise<GeneratedPost> {
  const 입력 = `${input.filename ? `(파일명: ${input.filename})\n` : ""}${input.text}`.slice(0, POST_INPUT_MAX);
  const r = await callHpc({
    지시: `${POST_SYSTEM}\n\n[자료]의 사업결과보고서를 바탕으로 블로그형 홍보글을 작성한다.\n\n${ANSWER_FORMAT_POST}`,
    입력,
    용도: "홍보글초안",
    최대글자: 5000,
    확인: "제목본문",
  });
  if (!r.ok || !r.answer) throw new HpcError(r);
  const p = parseLabeled(r.answer, "요약");
  return { title: p.title, summary: p.sub, content: p.content };
}

export interface CalendarEvent {
  start: string; // ISO date
  summary: string;
  description?: string;
  location?: string;
}

export interface StoryPlan {
  date: string;
  event: string;
  idea: string; // 스토리 컨셉
  caption: string; // 캡션 초안
  hashtags: string[];
}

const STORY_SYSTEM = `너는 완도 망남생활권 어촌신활력증진사업의 인스타그램 운영자다.
[자료]의 다가오는 일정 목록을 보고 각 일정에 맞는 인스타 스토리 기획안을 한국어로 작성한다.
- idea: 어떤 장면을 어떻게 찍을지 구체적인 컨셉 1~2문장
- caption: 스토리에 올릴 짧은 문구 (이모지 포함 가능)
- hashtags: 3~5개 (#망남마을 #완도 등 지역 태그 포함)
- 자료의 「(생략)」은 개인정보를 지운 자리다. 지어내 채우지 않는다.
답은 JSON 하나만 쓴다: {"stories":[{"date":"","event":"","idea":"","caption":"","hashtags":[""]}]}`;

/** 캘린더 일정으로 인스타 스토리 기획안 생성 */
export async function generateStoryPlans(events: CalendarEvent[]): Promise<StoryPlan[]> {
  const r = await callHpc({
    지시: STORY_SYSTEM,
    입력: JSON.stringify(events, null, 1).slice(0, 8000),
    용도: "인스타스토리기획",
    최대글자: 4000,
    확인: "json",
  });
  if (!r.ok) throw new HpcError(r);
  const stories = (r.data as { stories?: StoryPlan[] } | undefined)?.stories;
  if (!Array.isArray(stories) || !stories.length) throw new Error("AI 엔진 답의 형식이 맞지 않습니다.");
  return stories.map((s) => ({
    date: String(s.date ?? ""),
    event: String(s.event ?? ""),
    idea: String(s.idea ?? ""),
    caption: String(s.caption ?? ""),
    hashtags: Array.isArray(s.hashtags) ? s.hashtags.map(String) : [],
  }));
}

// ---------- 기획안·보고서 문서 생성 ----------

/** 문서 종류별 구성 지침 */
export const DOC_TYPES: Record<string, string> = {
  기획안: `기획안(사업계획서) 구성: ## 1. 추진 배경 및 목적 → ## 2. 추진 방향 → ## 3. 세부 추진 내용(### 소항목별) → ## 4. 추진 일정(표) → ## 5. 소요 예산(표, 자료에 근거가 있을 때만) → ## 6. 기대 효과`,
  보고서: `결과·실적 보고서 구성: ## 1. 사업 개요 → ## 2. 추진 경과(표 또는 목록) → ## 3. 주요 성과(정량 성과는 표) → ## 4. 문제점 및 개선 방향 → ## 5. 향후 계획`,
  공문: `공문(회신·요청) 구성: 본문 첫 문단 "1. 관련: (관련 근거)" → "2." 이하 번호 문단으로 용건 → 필요한 세부 내용은 표 → 마지막에 "붙임" 목록. 제목은 공문 제목 형식(예: "망남생활권 어촌신활력증진사업 ○○ 제출"). 수신자 표기가 자료에 있으면 첫 줄에 "수신: ○○" 를 넣는다.`,
  보도자료: `보도자료 구성: 첫 문단에 핵심 내용 요약(리드문) → ## 소제목별 상세 내용 → 마지막에 담당자 문의처(자료에 있을 때만). 객관적·사실 중심 문체.`,
  자유양식: `요청 내용에 가장 알맞은 구성을 스스로 판단해 작성한다.`,
};

const DOC_SYSTEM = `너는 전남광주통합특별시 완도군 망남생활권 어촌신활력증진사업 앵커조직(사회혁신교육원사회적협동조합)의 행정 문서 담당자다.
제공된 사업 지식 자료와 참고 자료를 근거로 관공서에 제출할 수준의 한국어 행정 문서를 작성한다.

원칙:
- 반드시 제공된 자료에 근거해 작성한다. 자료에 없는 수치·날짜·인명은 지어내지 말고, 확인이 필요한 자리는 (확인 필요: ○○) 로 표시한다.
- 행정 문서 문체: 개조식 위주(-임, -함, -을 계획), 간결하고 정확하게.
- 본문은 마크다운 형식으로 작성: ## 대제목, ### 중제목, #### 소제목, - 목록, 표는 GFM 표(| 구분 | ... |), 강조는 **굵게**.
- # (제목 1단계)는 쓰지 않는다 — 문서 제목은 「제목:」 줄에 따로 쓴다.
- 이미지·코드블록·인용문은 쓰지 않는다.
- 「부제:」 줄은 제목 아래 한 줄 (예: "2026. 8. 5. | 망남생활권 어촌신활력증진사업 앵커조직").
- 자료에 「(생략)」으로 가려진 자리는 개인정보를 지운 곳이다. 그 자리를 지어내 채우지 말고 그대로 두거나 (확인 필요)로 쓴다.`;

// 엔진은 6천~9천 자 안팎이면 제한초(90) 안에 답한다(26-10-22 실측). 요청·참고자료를 먼저 싣고 지식 자료는 남는 만큼.
const DOC_INPUT_MAX = 9000;
const DOC_REF_MAX = 5000;

/** 지식 자료 + 업로드 참고자료 + 키워드로 행정 문서(기획안·보고서 등) 생성 */
export async function generateDocument(input: {
  docType: string;
  title?: string;
  keywords?: string;
  instructions?: string;
  refs: { name: string; text?: string }[];
  knowledge: { name: string; text: string }[];
  today: string; // YYYY-MM-DD
}): Promise<GeneratedDoc> {
  const request = [
    `오늘 날짜: ${input.today}`,
    `문서 종류: ${input.docType}`,
    DOC_TYPES[input.docType] ?? DOC_TYPES.자유양식,
    input.title && `문서 제목(요청): ${input.title}`,
    input.keywords && `핵심 키워드: ${input.keywords}`,
    input.instructions && `추가 지시사항: ${input.instructions}`,
  ]
    .filter(Boolean)
    .join("\n");

  let refText = input.refs
    .filter((r) => r.text)
    .map((r) => `<참고자료 이름="${r.name}">\n${r.text}\n</참고자료>`)
    .join("\n\n");
  if (refText.length > DOC_REF_MAX) refText = refText.slice(0, DOC_REF_MAX) + "\n…(길이 제한으로 뒤 생략)";

  let room = DOC_INPUT_MAX - request.length - refText.length;
  const kParts: string[] = [];
  for (const k of input.knowledge) {
    if (room < 300) break;
    const body = k.text.slice(0, room - 40);
    kParts.push(`<자료 이름="${k.name}">\n${body}\n</자료>`);
    room -= body.length + 40;
  }

  const 입력 = [
    `[작성 요청]\n${request}`,
    refText && `[업로드된 참고 자료]\n${refText}`,
    kParts.length && `[사업 지식 자료]\n${kParts.join("\n\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const r = await callHpc({
    지시: `${DOC_SYSTEM}\n\n[자료]의 작성 요청에 맞춰, 참고 자료와 사업 지식 자료를 근거로 문서를 작성한다.\n\n${ANSWER_FORMAT_DOC}`,
    입력,
    용도: "행정문서초안",
    최대글자: 6000,
    확인: "제목본문",
  });
  if (!r.ok || !r.answer) throw new HpcError(r);
  const p = parseLabeled(r.answer, "부제");
  return { title: p.title, subtitle: p.sub, content: p.content };
}

/** AI 를 쓸 수 없을 때의 템플릿 기반 스토리 기획 */
export function fallbackStoryPlans(events: CalendarEvent[]): StoryPlan[] {
  return events.map((e) => ({
    date: e.start,
    event: e.summary,
    idea: `${e.summary} 현장의 준비 과정과 참여 주민의 모습을 스토리로 담기`,
    caption: `📍 ${e.summary} — 망남마을의 오늘을 전해드려요!`,
    hashtags: ["#망남마을", "#완도", "#어촌신활력", "#" + e.summary.replace(/\s/g, "")],
  }));
}
