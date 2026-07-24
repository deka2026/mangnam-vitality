"use client";

import { useEffect, useState } from "react";

interface Post {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  published: number;
  source_report: string | null;
  created_at: string;
}

interface Draft {
  id?: number;
  title: string;
  summary: string;
  content: string;
  source_report?: string | null;
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [reportText, setReportText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/posts");
    if (res.ok) setPosts((await res.json()).posts);
  };
  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setError("");
    setGenerating(true);
    const form = new FormData();
    if (reportText.trim()) form.set("text", reportText);
    if (file) form.set("file", file);
    const res = await fetch("/api/admin/posts/generate", { method: "POST", body: form });
    setGenerating(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "생성에 실패했습니다.");
      // AI 미설정 시에도 직접 작성할 수 있도록 빈 초안 열기
      if (res.status === 503) setDraft({ title: "", summary: "", content: reportText });
      return;
    }
    setDraft({ ...data.draft, source_report: data.source_report });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError("");
    const url = draft.id ? `/api/admin/posts/${draft.id}` : "/api/admin/posts";
    const res = await fetch(url, {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        summary: draft.summary,
        content: draft.content,
        source_report: draft.source_report,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "저장에 실패했습니다.");
      return;
    }
    setDraft(null);
    setReportText("");
    setFile(null);
    await load();
  };

  const togglePublish = async (p: Post) => {
    await fetch(`/api/admin/posts/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm("이 글을 삭제할까요?")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">📰 소식·홍보글 관리</h1>

      {/* 보고서 → 홍보글 생성 */}
      <div className="card mt-5">
        <h2 className="font-bold text-sea-800">사업결과보고서 → 홍보글 자동 작성</h2>
        <p className="mt-1 text-sm text-sea-600">
          보고서 파일(PDF, 텍스트)을 올리거나 내용을 붙여넣으면 블로그형 홍보글 초안을
          만들어 드립니다. 초안을 검토·수정한 뒤 게시하세요.
        </p>
        <div className="mt-4 space-y-3">
          <input
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-sea-700"
          />
          <textarea
            className="input"
            rows={5}
            placeholder="또는 보고서 내용을 여기에 붙여넣으세요..."
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={generate} disabled={generating}>
              {generating ? "🤖 작성 중... (최대 1~2분)" : "🤖 홍보글 초안 생성"}
            </button>
            <button
              className="btn-outline"
              onClick={() => setDraft({ title: "", summary: "", content: "" })}
            >
              ✍️ 직접 작성
            </button>
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      </div>

      {/* 초안 편집기 */}
      {draft && (
        <div className="card mt-5 ring-sea-300">
          <h2 className="font-bold text-sea-800">
            {draft.id ? `글 수정 (#${draft.id})` : "새 글 (초안 검토)"}
          </h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">제목</label>
              <input
                className="input"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label">요약 (목록에 표시)</label>
              <textarea
                className="input"
                rows={2}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              />
            </div>
            <div>
              <label className="label">본문 (마크다운: ## 소제목, - 목록, **굵게**)</label>
              <textarea
                className="input font-mono text-sm"
                rows={16}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "저장 중..." : draft.id ? "수정 저장" : "게시하기"}
              </button>
              <button className="btn-outline" onClick={() => setDraft(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 글 목록 */}
      <div className="mt-6 space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.published ? "bg-sea-100 text-sea-700" : "bg-earth-100 text-earth-700"
                  }`}
                >
                  {p.published ? "게시중" : "비공개"}
                </span>
                <h3 className="font-bold text-sea-900 truncate">{p.title}</h3>
              </div>
              <p className="mt-1 text-xs text-sea-500">
                {p.created_at}
                {p.source_report && ` · 원본: ${p.source_report}`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="btn-outline text-sm px-3 py-1.5"
                onClick={() =>
                  setDraft({
                    id: p.id,
                    title: p.title,
                    summary: p.summary ?? "",
                    content: p.content,
                    source_report: p.source_report,
                  })
                }
              >
                수정
              </button>
              <button className="btn-outline text-sm px-3 py-1.5" onClick={() => togglePublish(p)}>
                {p.published ? "내리기" : "게시"}
              </button>
              <button
                className="rounded-md px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                onClick={() => remove(p.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
