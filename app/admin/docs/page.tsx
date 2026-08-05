"use client";

import { useEffect, useRef, useState } from "react";

interface Doc {
  id: number;
  doc_type: string;
  title: string;
  subtitle: string | null;
  keywords: string | null;
  content: string;
  source_files: string | null;
  knowledge_used: string | null;
  created_at: string;
  updated_at: string;
}

interface Draft {
  id?: number;
  doc_type: string;
  title: string;
  subtitle: string;
  content: string;
}

const DOC_TYPES = ["기획안", "보고서", "공문", "보도자료", "자유양식"];

export default function AdminDocs() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [docType, setDocType] = useState("기획안");
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pasted, setPasted] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch("/api/admin/docs");
    if (res.ok) setDocs((await res.json()).docs);
  };
  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setError("");
    setGenerating(true);
    const form = new FormData();
    form.set("doc_type", docType);
    form.set("title", title);
    form.set("keywords", keywords);
    form.set("instructions", instructions);
    form.set("text", pasted);
    for (const f of files) form.append("files", f);
    const res = await fetch("/api/admin/docs/generate", { method: "POST", body: form });
    setGenerating(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "생성에 실패했습니다.");
      // AI 미설정 시에도 직접 작성 → 한글파일 변환은 쓸 수 있게 빈 초안 열기
      if (res.status === 503)
        setDraft({ doc_type: docType, title: title, subtitle: "", content: pasted });
      return;
    }
    const d = data.doc as Doc;
    setDraft({
      id: d.id,
      doc_type: d.doc_type,
      title: d.title,
      subtitle: d.subtitle ?? "",
      content: d.content,
    });
    setFiles([]);
    if (fileInput.current) fileInput.current.value = "";
    await load();
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.content.trim()) {
      setError("제목과 본문을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    const url = draft.id ? `/api/admin/docs/${draft.id}` : "/api/admin/docs";
    const res = await fetch(url, {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_type: draft.doc_type,
        title: draft.title,
        subtitle: draft.subtitle,
        content: draft.content,
      }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "저장에 실패했습니다.");
      return;
    }
    setDraft({
      id: data.doc.id,
      doc_type: data.doc.doc_type,
      title: data.doc.title,
      subtitle: data.doc.subtitle ?? "",
      content: data.doc.content,
    });
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm("이 문서를 삭제할까요?")) return;
    await fetch(`/api/admin/docs/${id}`, { method: "DELETE" });
    if (draft?.id === id) setDraft(null);
    await load();
  };

  const parseJson = (s: string | null): string[] => {
    try {
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">📄 기획안·보고서 작성</h1>

      {/* 생성 폼 */}
      <div className="card mt-5">
        <h2 className="font-bold text-sea-800">사업 자료 기반 문서 자동 작성</h2>
        <p className="mt-1 text-sm text-sea-600">
          사업 기본계획서·위키 자료를 바탕으로 기획안, 보고서, 공문을 만들어 드립니다.
          자료 요청 공문이나 추가 자료(PDF·한글·워드·엑셀·텍스트)를 올리면 그 내용을
          반영하고, 완성된 문서는 <b>한글파일(.hwpx)</b>로 내려받을 수 있습니다.
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="label mb-0">문서 종류</label>
            {DOC_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setDocType(t)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  docType === t
                    ? "bg-sea-600 text-white"
                    : "bg-sea-50 text-sea-700 hover:bg-sea-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="label">문서 제목 (비우면 자동으로 정합니다)</label>
            <input
              className="input"
              placeholder="예: 2026년 어촌체험 프로그램 운영 기획안"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">핵심 키워드 (쉼표로 구분)</label>
            <input
              className="input"
              placeholder="예: 교육문화스테이션, 주민역량, 하반기 일정"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div>
            <label className="label">추가 지시사항 (선택)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="예: 완도군 제출용, 3쪽 분량, 예산표 포함"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              참고자료 업로드 (자료 요청 공문·추가 자료 — 여러 개 가능)
            </label>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.hwp,.hwpx,.docx,.xlsx,.xls,.txt,.md,.csv"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block text-sm text-sea-700"
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-sea-500">{files.map((f) => f.name).join(", ")}</p>
            )}
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="또는 참고할 내용을 여기에 붙여넣으세요... (선택)"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={generate} disabled={generating}>
              {generating ? "🤖 작성 중... (최대 2~3분)" : "🤖 문서 초안 생성"}
            </button>
            <button
              className="btn-outline"
              onClick={() =>
                setDraft({ doc_type: docType, title: "", subtitle: "", content: "" })
              }
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-sea-800">
              {draft.id ? `문서 편집 (#${draft.id})` : "새 문서 (직접 작성)"}
            </h2>
            {draft.id && (
              <a className="btn-primary text-sm px-3 py-1.5" href={`/api/admin/docs/${draft.id}/download`}>
                📥 한글파일 다운로드
              </a>
            )}
          </div>
          <p className="mt-1 text-xs text-sea-500">
            수정한 뒤 반드시 저장하세요 — 다운로드되는 한글파일은 저장된 내용 기준입니다.
          </p>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
              <div>
                <label className="label">종류</label>
                <select
                  className="input"
                  value={draft.doc_type}
                  onChange={(e) => setDraft({ ...draft, doc_type: e.target.value })}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">제목</label>
                <input
                  className="input"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">부제 (제목 아래 한 줄 — 날짜·작성 주체)</label>
              <input
                className="input"
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                본문 (마크다운: ## 대제목, ### 중제목, - 목록, | 표 |, **굵게**)
              </label>
              <textarea
                className="input font-mono text-sm"
                rows={20}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </button>
              <button className="btn-outline" onClick={() => setDraft(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 문서 목록 */}
      <div className="mt-6 space-y-3">
        {docs.map((d) => (
          <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sea-100 px-2.5 py-0.5 text-xs font-medium text-sea-700">
                  {d.doc_type}
                </span>
                <h3 className="font-bold text-sea-900 truncate">{d.title}</h3>
              </div>
              <p className="mt-1 text-xs text-sea-500">
                {d.created_at}
                {parseJson(d.source_files).length > 0 &&
                  ` · 참고자료: ${parseJson(d.source_files).join(", ")}`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a className="btn-outline text-sm px-3 py-1.5" href={`/api/admin/docs/${d.id}/download`}>
                📥 한글파일
              </a>
              <button
                className="btn-outline text-sm px-3 py-1.5"
                onClick={() =>
                  setDraft({
                    id: d.id,
                    doc_type: d.doc_type,
                    title: d.title,
                    subtitle: d.subtitle ?? "",
                    content: d.content,
                  })
                }
              >
                편집
              </button>
              <button
                className="rounded-md px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                onClick={() => remove(d.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {docs.length === 0 && (
          <p className="text-sm text-sea-500">아직 만든 문서가 없습니다.</p>
        )}
      </div>
    </>
  );
}
