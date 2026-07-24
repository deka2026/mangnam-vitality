"use client";

import { useEffect, useState } from "react";

interface Inquiry {
  id: number;
  kind: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
}

export default function AdminInquiries() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");

  const load = async () => {
    const res = await fetch("/api/inquiries");
    if (res.ok) setItems((await res.json()).inquiries);
  };
  useEffect(() => {
    load();
  }, []);

  const answer = async (id: number) => {
    const text = drafts[id];
    if (!text?.trim()) return;
    setBusy(id);
    await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: text }),
    });
    setBusy(null);
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm("이 문의를 삭제할까요?")) return;
    await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
    await load();
  };

  const shown = items.filter((it) =>
    filter === "all" ? true : filter === "open" ? !it.answer : !!it.answer
  );

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">📨 문의 관리</h1>
      <p className="mt-1 text-sm text-sea-600">
        답변을 작성하면 이 화면에 기록됩니다. 실제 회신은 문의자 전화번호로 연락하거나
        문자 발송 메뉴를 이용하세요.
      </p>

      <div className="mt-4 flex gap-2">
        {(
          [
            ["open", "미답변"],
            ["done", "답변완료"],
            ["all", "전체"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === key ? "bg-sea-600 text-white" : "bg-sea-50 text-sea-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {shown.length === 0 && (
          <div className="card bg-earth-50 ring-earth-200 text-sm text-sea-700">
            해당하는 문의가 없습니다.
          </div>
        )}
        {shown.map((it) => (
          <div key={it.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sea-100 px-2.5 py-0.5 text-xs font-medium text-sea-700">
                  {it.kind}
                </span>
                <span className="font-bold text-sea-900">{it.name}</span>
                <span className="text-sm text-sea-600">{it.phone}</span>
                {it.email && <span className="text-sm text-sea-500">{it.email}</span>}
              </div>
              <span className="text-xs text-sea-500">{it.created_at}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-sea-800">{it.message}</p>

            {it.answer ? (
              <div className="mt-3 rounded-xl bg-sea-50 p-3 ring-1 ring-sea-100">
                <p className="text-xs font-bold text-sea-600">
                  ✅ 답변 ({it.answered_at})
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-sea-800">{it.answer}</p>
              </div>
            ) : (
              <div className="mt-3">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="답변 내용을 작성하세요..."
                  value={drafts[it.id] ?? ""}
                  onChange={(e) => setDrafts({ ...drafts, [it.id]: e.target.value })}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn-primary text-sm"
                    onClick={() => answer(it.id)}
                    disabled={busy === it.id}
                  >
                    {busy === it.id ? "저장 중..." : "답변 저장"}
                  </button>
                  <button
                    className="rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                    onClick={() => remove(it.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
