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

const POST_SYSTEM = `너는 전라남도 완도군 망남생활권 어촌신활력증진사업의 홍보 담당자다.
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
