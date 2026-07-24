"use client";

import { useEffect, useState } from "react";

interface Content {
  id: number;
  title: string;
  body: string | null;
  media_id: number | null;
  insta_url: string | null;
  filename: string | null;
  kind: string | null;
  created_at: string;
}
interface MediaOpt {
  id: number;
  kind: string;
  filename: string;
  caption: string | null;
}
interface Plan {
  date: string;
  event: string;
  idea: string;
  caption: string;
  hashtags: string[];
}

const EMPTY = { title: "", body: "", media_id: 0, insta_url: "" };

export default function AdminInsta() {
  const [contents, setContents] = useState<Content[]>([]);
  const [media, setMedia] = useState<MediaOpt[]>([]);
  const [account, setAccount] = useState("");
  const [icsUrl, setIcsUrl] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planAi, setPlanAi] = useState(false);
  const [busy, setBusy] = useState<"" | "save" | "plan" | "setting">("");
  const [msg, setMsg] = useState("");
  const [planMsg, setPlanMsg] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/insta");
    if (res.ok) {
      const data = await res.json();
      setContents(data.contents);
      setMedia(data.media);
      setAccount(data.insta_account ?? "");
      setIcsUrl(data.ics_url ?? "");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    setBusy("setting");
    await fetch("/api/admin/insta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insta_account: account, ics_url: icsUrl }),
    });
    setBusy("");
    setMsg("✅ 설정을 저장했습니다.");
  };

  const saveContent = async () => {
    if (!form.title.trim()) {
      setMsg("제목을 입력해 주세요.");
      return;
    }
    setBusy("save");
    const res = await fetch("/api/admin/insta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, media_id: form.media_id || null }),
    });
    setBusy("");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(`❌ ${data.error || "저장 실패"}`);
      return;
    }
    setForm(EMPTY);
    setMsg("✅ 콘텐츠를 등록했습니다.");
    await load();
  };

  const removeContent = async (id: number) => {
    if (!confirm("이 콘텐츠를 삭제할까요?")) return;
    await fetch(`/api/admin/insta/${id}`, { method: "DELETE" });
    await load();
  };

  const makePlans = async () => {
    setBusy("plan");
    setPlanMsg("");
    const res = await fetch("/api/admin/insta/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ics_url: icsUrl }),
    });
    setBusy("");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPlanMsg(`❌ ${data.error || "기획안 생성 실패"}`);
      return;
    }
    setPlans(data.plans);
    setPlanAi(data.ai);
    setPlanMsg(
      `✅ 일정 ${data.eventCount}건으로 기획안을 만들었습니다.${data.ai ? "" : " (AI 미설정 — 기본 템플릿)"}`
    );
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">📸 인스타 콘텐츠 관리</h1>

      {/* 설정 */}
      <div className="card mt-5">
        <h2 className="font-bold text-sea-800">설정</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">인스타그램 계정 (공개 페이지 버튼에 사용)</label>
            <input
              className="input"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="@mangnam_village"
            />
          </div>
          <div>
            <label className="label">구글 캘린더 ICS 주소 (스토리 기획용)</label>
            <input
              className="input"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..../basic.ics"
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-sea-500">
          ICS 주소: 구글 캘린더 → 설정 → 해당 캘린더 → "iCal 형식의 비공개 주소" 복사
        </p>
        <button className="btn-outline mt-3" onClick={saveSettings} disabled={busy === "setting"}>
          설정 저장
        </button>
        {msg && <p className="mt-2 text-sm text-sea-700">{msg}</p>}
      </div>

      {/* 스토리 기획 */}
      <div className="card mt-5">
        <h2 className="font-bold text-sea-800">🗓 캘린더 → 인스타 스토리 기획</h2>
        <p className="mt-1 text-sm text-sea-600">
          구글 캘린더의 앞으로 30일 일정을 읽어 스토리 촬영 컨셉·문구·해시태그를
          만들어 드립니다.
        </p>
        <button className="btn-primary mt-3" onClick={makePlans} disabled={busy === "plan"}>
          {busy === "plan" ? "🤖 기획 중..." : "스토리 기획안 만들기"}
        </button>
        {planMsg && <p className="mt-2 text-sm text-sea-700">{planMsg}</p>}

        {plans.length > 0 && (
          <div className="mt-4 space-y-3">
            {plans.map((p, i) => (
              <div key={i} className="rounded-xl bg-sea-50 p-4 ring-1 ring-sea-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sea-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    {p.date}
                  </span>
                  <span className="font-bold text-sea-800">{p.event}</span>
                </div>
                <p className="mt-2 text-sm text-sea-800">🎬 {p.idea}</p>
                <p className="mt-1 text-sm text-sea-700">✏️ {p.caption}</p>
                <p className="mt-1 text-xs text-sea-500">{p.hashtags.join(" ")}</p>
                <button
                  className="mt-2 text-sm text-sea-600 hover:underline"
                  onClick={() =>
                    setForm({
                      title: `[스토리] ${p.event}`,
                      body: `${p.caption}\n${p.hashtags.join(" ")}`,
                      media_id: 0,
                      insta_url: "",
                    })
                  }
                >
                  ↓ 이 기획안으로 콘텐츠 작성
                </button>
              </div>
            ))}
            {planAi && (
              <p className="text-xs text-sea-500">🤖 Claude가 작성한 기획안입니다. 촬영 전 현장 상황에 맞게 조정하세요.</p>
            )}
          </div>
        )}
      </div>

      {/* 콘텐츠 등록 */}
      <div className="card mt-5">
        <h2 className="font-bold text-sea-800">콘텐츠 등록 (공개 페이지에 표시)</h2>
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">제목 *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">캡션/본문</label>
            <textarea className="input" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">사진/영상 연결 (사진·영상 메뉴에서 업로드)</label>
              <select
                className="input"
                value={form.media_id}
                onChange={(e) => setForm({ ...form, media_id: Number(e.target.value) })}
              >
                <option value={0}>없음</option>
                {media.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.id} {m.kind === "video" ? "🎬" : "🖼"} {m.caption || m.filename}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">인스타 게시물 링크 (선택)</label>
              <input
                className="input"
                value={form.insta_url}
                onChange={(e) => setForm({ ...form, insta_url: e.target.value })}
                placeholder="https://www.instagram.com/p/..."
              />
            </div>
          </div>
          <button className="btn-primary" onClick={saveContent} disabled={busy === "save"}>
            등록
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className="mt-6 space-y-2">
        {contents.map((c) => (
          <div key={c.id} className="card flex items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="font-bold text-sea-900 truncate">{c.title}</p>
              <p className="text-xs text-sea-500">
                {c.created_at}
                {c.filename && " · 미디어 연결됨"}
                {c.insta_url && " · 인스타 링크"}
              </p>
            </div>
            <button
              className="shrink-0 rounded-md px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
              onClick={() => removeContent(c.id)}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
