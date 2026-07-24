import type { CalendarEvent } from "./claude";

// 구글 캘린더 비공개 ICS 주소(…/basic.ics)를 받아 일정을 파싱한다.
function unfold(text: string): string[] {
  // ICS는 75자에서 줄바꿈 후 공백으로 이어진다
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n");
}

function parseDate(value: string): string | null {
  // 20260801, 20260801T090000, 20260801T000000Z
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return h ? `${y}-${mo}-${d} ${h}:${mi}` : `${y}-${mo}-${d}`;
}

function unescapeText(v: string): string {
  return v.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").trim();
}

export async function fetchCalendarEvents(
  icsUrl: string,
  daysAhead = 30
): Promise<CalendarEvent[]> {
  const res = await fetch(icsUrl, { headers: { "User-Agent": "mangnam-vitality" } });
  if (!res.ok) throw new Error(`캘린더를 불러올 수 없습니다 (HTTP ${res.status})`);
  const lines = unfold(await res.text());

  const events: CalendarEvent[] = [];
  let cur: Partial<CalendarEvent> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
    } else if (line === "END:VEVENT") {
      if (cur?.start && cur.summary) events.push(cur as CalendarEvent);
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const key = line.slice(0, idx).split(";")[0].toUpperCase();
      const value = line.slice(idx + 1);
      if (key === "DTSTART") cur.start = parseDate(value) ?? undefined;
      else if (key === "SUMMARY") cur.summary = unescapeText(value);
      else if (key === "DESCRIPTION") cur.description = unescapeText(value).slice(0, 300);
      else if (key === "LOCATION") cur.location = unescapeText(value);
    }
  }

  // 오늘 ~ daysAhead일 이내 일정만, 날짜순
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return events
    .filter((e) => {
      const d = new Date(e.start.replace(" ", "T"));
      return d >= now && d <= limit;
    })
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 20);
}
