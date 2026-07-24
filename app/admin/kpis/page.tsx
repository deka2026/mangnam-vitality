"use client";

import { useEffect, useState } from "react";

interface Kpi {
  id: number;
  label: string;
  value: string;
  unit: string | null;
  note: string | null;
  sort: number;
}

const EMPTY = { label: "", value: "", unit: "", note: "", sort: 0 };

export default function AdminKpis() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [form, setForm] = useState<typeof EMPTY & { id?: number }>(EMPTY);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/kpis");
    if (res.ok) setKpis((await res.json()).kpis);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setError("");
    const url = form.id ? `/api/admin/kpis/${form.id}` : "/api/admin/kpis";
    const res = await fetch(url, {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "저장 실패");
      return;
    }
    setForm(EMPTY);
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm("이 지표를 삭제할까요?")) return;
    await fetch(`/api/admin/kpis/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">📊 KPI 성과 관리</h1>
      <p className="mt-1 text-sm text-sea-600">
        사업소식 페이지 상단 "사업 성과 한눈에" 영역에 표시됩니다. 예: 마을식당 이용
        1,200명, 빈집 리모델링 4채
      </p>

      <div className="card mt-5">
        <h2 className="font-bold text-sea-800">{form.id ? `지표 수정 (#${form.id})` : "지표 추가"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label">지표명 *</label>
            <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="마을식당 이용" />
          </div>
          <div>
            <label className="label">값 *</label>
            <input className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="1,200" />
          </div>
          <div>
            <label className="label">단위</label>
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="명" />
          </div>
          <div>
            <label className="label">비고</label>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="2026년 상반기" />
          </div>
          <div>
            <label className="label">정렬순서</label>
            <input className="input" type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} />
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button className="btn-primary" onClick={save}>
            {form.id ? "수정 저장" : "추가"}
          </button>
          {form.id && (
            <button className="btn-outline" onClick={() => setForm(EMPTY)}>
              취소
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.id} className="card">
            <p className="text-2xl font-bold text-sea-700">
              {k.value}
              {k.unit && <span className="text-sm font-medium text-sea-500 ml-1">{k.unit}</span>}
            </p>
            <p className="text-sm font-medium text-sea-800">{k.label}</p>
            {k.note && <p className="text-xs text-sea-500">{k.note}</p>}
            <div className="mt-2 flex gap-2">
              <button
                className="text-sm text-sea-600 hover:underline"
                onClick={() =>
                  setForm({
                    id: k.id,
                    label: k.label,
                    value: k.value,
                    unit: k.unit ?? "",
                    note: k.note ?? "",
                    sort: k.sort,
                  })
                }
              >
                수정
              </button>
              <button className="text-sm text-red-500 hover:underline" onClick={() => remove(k.id)}>
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
