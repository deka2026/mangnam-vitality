import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { getSetting, setSetting } from "@/lib/db";
import { fetchCalendarEvents } from "@/lib/ics";
import { aiEnabled, generateStoryPlans, fallbackStoryPlans } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// 구글 캘린더(ICS)를 읽어 인스타 스토리 기획안을 만든다.
export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const icsUrl: string = (body.ics_url || getSetting("ics_url") || "").trim();
  if (!icsUrl) {
    return NextResponse.json(
      { error: "구글 캘린더 ICS 주소를 입력해 주세요. (구글 캘린더 설정 → 'iCal 형식의 비공개 주소' 복사)" },
      { status: 400 }
    );
  }
  if (body.ics_url) setSetting("ics_url", icsUrl);

  let events;
  try {
    events = await fetchCalendarEvents(icsUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "캘린더를 불러오지 못했습니다." },
      { status: 400 }
    );
  }
  if (!events.length) {
    return NextResponse.json(
      { error: "앞으로 30일 이내 일정이 없습니다. 캘린더에 일정을 먼저 등록해 주세요." },
      { status: 400 }
    );
  }

  try {
    const plans = aiEnabled() ? await generateStoryPlans(events) : fallbackStoryPlans(events);
    return NextResponse.json({ plans, ai: aiEnabled(), eventCount: events.length });
  } catch (err) {
    console.error("story plan failed:", err);
    // AI 실패 시 템플릿으로라도 제공
    return NextResponse.json({ plans: fallbackStoryPlans(events), ai: false, eventCount: events.length });
  }
}
