import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function client(): Anthropic {
  return new Anthropic();
}

export interface GeneratedPost {
  title: string;
  summary: string;
  content: string; // markdown
}

const POST_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    content: { type: "string" },
  },
  required: ["title", "summary", "content"],
  additionalProperties: false,
} as const;

const POST_SYSTEM = `너는 전남광주통합특별시 완도군 망남생활권 어촌신활력증진사업의 홍보 담당자다.
사업결과보고서를 받아 마을 주민과 일반 방문객이 읽기 좋은 블로그형 홍보글을 한국어로 작성한다.
- 따뜻하고 친근한 어조, 과장 없이 사실에 근거
- 마크다운 형식 (## 소제목, 목록 활용), 800~1500자
- title: 눈길을 끄는 제목 (30자 이내), summary: 2문장 요약
- content: 배경 → 활동 내용 → 성과 → 앞으로의 계획 흐름`;

/** 보고서(텍스트 또는 PDF)에서 블로그형 홍보글 생성 */
export async function generatePostFromReport(input: {
  text?: string;
  pdfBase64?: string;
  filename?: string;
}): Promise<GeneratedPost> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (input.pdfBase64) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 },
    });
  }
  content.push({
    type: "text",
    text: `다음 사업결과보고서를 바탕으로 블로그형 홍보글을 작성해줘.${
      input.filename ? ` (파일명: ${input.filename})` : ""
    }\n\n${input.text ?? ""}`,
  });

  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 8000,
    system: POST_SYSTEM,
    output_config: {
      format: { type: "json_schema", schema: POST_SCHEMA },
    },
    messages: [{ role: "user", content }],
  } as Anthropic.MessageStreamParams);
  const message = await stream.finalMessage();
  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("AI 응답에 본문이 없습니다.");
  return JSON.parse(text.text) as GeneratedPost;
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

const STORY_SCHEMA = {
  type: "object",
  properties: {
    stories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          event: { type: "string" },
          idea: { type: "string" },
          caption: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
        },
        required: ["date", "event", "idea", "caption", "hashtags"],
        additionalProperties: false,
      },
    },
  },
  required: ["stories"],
  additionalProperties: false,
} as const;

/** 캘린더 일정으로 인스타 스토리 기획안 생성 */
export async function generateStoryPlans(events: CalendarEvent[]): Promise<StoryPlan[]> {
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 8000,
    system: `너는 완도 망남생활권 어촌신활력증진사업의 인스타그램 운영자다.
다가오는 일정 목록을 보고 각 일정에 맞는 인스타 스토리 기획안을 한국어로 작성한다.
- idea: 어떤 장면을 어떻게 찍을지 구체적인 컨셉 1~2문장
- caption: 스토리에 올릴 짧은 문구 (이모지 포함 가능)
- hashtags: 3~5개 (#망남마을 #완도 등 지역 태그 포함)`,
    output_config: { format: { type: "json_schema", schema: STORY_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `다음 일정들에 대한 인스타 스토리 기획안을 만들어줘:\n${JSON.stringify(
          events,
          null,
          2
        )}`,
      },
    ],
  } as Anthropic.MessageStreamParams);
  const message = await stream.finalMessage();
  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("AI 응답에 본문이 없습니다.");
  return (JSON.parse(text.text) as { stories: StoryPlan[] }).stories;
}

// ---------- 기획안·보고서 문서 생성 ----------

export interface GeneratedDoc {
  title: string;
  subtitle: string; // 제목 아래 한 줄 (작성일·작성 주체)
  content: string; // markdown
}

const DOC_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    content: { type: "string" },
  },
  required: ["title", "subtitle", "content"],
  additionalProperties: false,
} as const;

/** 문서 종류별 구성 지침 */
export const DOC_TYPES: Record<string, string> = {
  기획안: `기획안(사업계획서) 구성: ## 1. 추진 배경 및 목적 → ## 2. 추진 방향 → ## 3. 세부 추진 내용(### 소항목별) → ## 4. 추진 일정(표) → ## 5. 소요 예산(표, 자료에 근거가 있을 때만) → ## 6. 기대 효과`,
  보고서: `결과·실적 보고서 구성: ## 1. 사업 개요 → ## 2. 추진 경과(표 또는 목록) → ## 3. 주요 성과(정량 성과는 표) → ## 4. 문제점 및 개선 방향 → ## 5. 향후 계획`,
  공문: `공문(회신·요청) 구성: 본문 첫 문단 "1. 관련: (관련 근거)" → "2." 이하 번호 문단으로 용건 → 필요한 세부 내용은 표 → 마지막에 "붙임" 목록. 제목은 공문 제목 형식(예: "망남생활권 어촌신활력증진사업 ○○ 제출"). 수신자 표기가 자료에 있으면 첫 줄에 "수신: ○○" 를 넣는다.`,
  보도자료: `보도자료 구성: 첫 문단에 핵심 내용 요약(리드문) → ## 소제목별 상세 내용 → 마지막에 담당자 문의처(자료에 있을 때만). 객관적·사실 중심 문체.`,
  자유양식: `요청 내용에 가장 알맞은 구성을 스스로 판단해 작성한다.`,
};

const DOC_SYSTEM = `너는 전남 완도군 망남생활권 어촌신활력증진사업 앵커조직(사회혁신교육원사회적협동조합)의 행정 문서 담당자다.
제공된 사업 지식 자료와 참고 자료를 근거로 관공서에 제출할 수준의 한국어 행정 문서를 작성한다.

원칙:
- 반드시 제공된 자료에 근거해 작성한다. 자료에 없는 수치·날짜·인명은 지어내지 말고, 확인이 필요한 자리는 (확인 필요: ○○) 로 표시한다.
- 행정 문서 문체: 개조식 위주(-임, -함, -을 계획), 간결하고 정확하게.
- 마크다운 형식으로 작성: ## 대제목, ### 중제목, #### 소제목, - 목록, 표는 GFM 표(| 구분 | ... |), 강조는 **굵게**.
- # (제목 1단계)는 쓰지 않는다 — 문서 제목은 title 필드에 따로 담는다.
- 이미지·코드블록·인용문은 쓰지 않는다.
- title: 문서 제목. subtitle: 제목 아래 한 줄 (예: "2026. 8. 5. | 망남생활권 어촌신활력증진사업 앵커조직").`;

/** 지식 자료 + 업로드 참고자료 + 키워드로 행정 문서(기획안·보고서 등) 생성 */
export async function generateDocument(input: {
  docType: string;
  title?: string;
  keywords?: string;
  instructions?: string;
  refs: { name: string; text?: string; pdfBase64?: string }[];
  knowledge: { name: string; text: string }[];
  today: string; // YYYY-MM-DD
}): Promise<GeneratedDoc> {
  const content: Anthropic.ContentBlockParam[] = [];

  for (const ref of input.refs) {
    if (ref.pdfBase64) {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: ref.pdfBase64 },
        title: ref.name,
      } as Anthropic.ContentBlockParam);
    }
  }

  const knowledgeText = input.knowledge
    .map((k) => `<자료 이름="${k.name}">\n${k.text}\n</자료>`)
    .join("\n\n");
  const refText = input.refs
    .filter((r) => r.text)
    .map((r) => `<참고자료 이름="${r.name}">\n${r.text}\n</참고자료>`)
    .join("\n\n");

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

  content.push({
    type: "text",
    text: [
      knowledgeText && `[사업 지식 자료]\n${knowledgeText}`,
      refText && `[업로드된 참고 자료]\n${refText}`,
      `[작성 요청]\n${request}\n\n위 자료를 근거로 문서를 작성해줘.`,
    ]
      .filter(Boolean)
      .join("\n\n---\n\n"),
  });

  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 16000,
    system: DOC_SYSTEM,
    output_config: { format: { type: "json_schema", schema: DOC_SCHEMA } },
    messages: [{ role: "user", content }],
  } as Anthropic.MessageStreamParams);
  const message = await stream.finalMessage();
  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("AI 응답에 본문이 없습니다.");
  return JSON.parse(text.text) as GeneratedDoc;
}

/** AI 키가 없을 때의 템플릿 기반 스토리 기획 */
export function fallbackStoryPlans(events: CalendarEvent[]): StoryPlan[] {
  return events.map((e) => ({
    date: e.start,
    event: e.summary,
    idea: `${e.summary} 현장의 준비 과정과 참여 주민의 모습을 스토리로 담기`,
    caption: `📍 ${e.summary} — 망남마을의 오늘을 전해드려요!`,
    hashtags: ["#망남마을", "#완도", "#어촌신활력", "#" + e.summary.replace(/\s/g, "")],
  }));
}
