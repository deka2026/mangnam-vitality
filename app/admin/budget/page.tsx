"use client";

import { useEffect, useState } from "react";

interface Agg {
  year: number;
  project?: string;
  category?: string;
  planned: number;
  spent: number;
}
interface Item {
  id: number;
  year: number;
  project: string;
  category: string;
  item: string | null;
  planned: number;
  spent: number;
  source_file: string | null;
}

function won(n: number): string {
  return n.toLocaleString("ko-KR");
}

function Bar({ planned, spent }: { planned: number; spent: number }) {
  const pct = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;
  return (
    <div className="mt-1">
      <div className="h-2 w-full rounded-full bg-sea-100">
        <div className="h-2 rounded-full bg-sea-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-0.5 text-xs text-sea-500">집행률 {pct}%</p>
    </div>
  );
}

export default function AdminBudget() {
  const [byYear, setByYear] = useState<Agg[]>([]);
  const [byProject, setByProject] = useState<Agg[]>([]);
  const [byCategory, setByCategory] = useState<Agg[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<"project" | "category" | "items">("project");
  const [year, setYear] = useState<number | "all">("all");
  const [file, setFile] = useState<File | null>(null);
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/budget");
    if (res.ok) {
      const data = await res.json();
      setByYear(data.byYear);
      setByProject(data.byProject);
      setByCategory(data.byCategory);
      setItems(data.items);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    if (!file) {
      setMsg("엑셀 파일을 선택해 주세요.");
      return;
    }
    setBusy(true);
    setMsg("");
    const form = new FormData();
    form.set("file", file);
    form.set("replace", String(replace));
    const res = await fetch("/api/admin/budget", { method: "POST", body: form });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(`❌ ${data.error || "업로드 실패"}`);
      return;
    }
    setMsg(`✅ ${data.count}개 항목을 불러왔습니다.`);
    setFile(null);
    (document.getElementById("budget-file") as HTMLInputElement).value = "";
    await load();
  };

  const years = byYear.map((y) => y.year);
  const filterYear = <T extends Agg>(rows: T[]) =>
    year === "all" ? rows : rows.filter((r) => r.year === year);

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">💰 예산 집행실적</h1>
      <p className="mt-1 text-sm text-sea-600">
        예산집행 엑셀을 업로드하면 연도별·사업별·품목별로 자동 정리됩니다.
      </p>

      <div className="card mt-5">
        <h2 className="font-bold text-sea-800">엑셀 업로드</h2>
        <p className="mt-1 text-xs text-sea-500">
          헤더에 <b>예산(액)</b>·<b>집행(액)</b> 열이 있으면 자동 인식합니다. 권장 열:
          연도 · 사업명 · 품목 · 내용 · 예산액 · 집행액 (시트명에 연도가 있어도 인식)
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            id="budget-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-sea-700"
          />
          <label className="flex items-center gap-1.5 text-sm text-sea-700">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            기존 데이터 전체 교체
          </label>
          <button className="btn-primary" onClick={upload} disabled={busy}>
            {busy ? "처리 중..." : "업로드"}
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-sea-700">{msg}</p>}
      </div>

      {/* 연도별 요약 */}
      {byYear.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {byYear.map((y) => (
            <div key={y.year} className="card">
              <p className="font-bold text-sea-800">{y.year}년</p>
              <p className="mt-1 text-sm text-sea-700">예산 {won(y.planned)}원</p>
              <p className="text-sm text-sea-700">집행 {won(y.spent)}원</p>
              <Bar planned={y.planned} spent={y.spent} />
            </div>
          ))}
        </div>
      )}

      {/* 보기 전환 */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            ["project", "사업별"],
            ["category", "품목별"],
            ["items", "전체 항목"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              view === key ? "bg-sea-600 text-white" : "bg-sea-50 text-sea-700"
            }`}
          >
            {label}
          </button>
        ))}
        <select
          className="input w-auto py-1.5 text-sm"
          value={year}
          onChange={(e) => setYear(e.target.value === "all" ? "all" : Number(e.target.value))}
        >
          <option value="all">전체 연도</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      {view !== "items" ? (
        <div className="mt-4 space-y-3">
          {filterYear(view === "project" ? byProject : byCategory).map((r, i) => (
            <div key={i} className="card py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-sea-800">
                  <span className="text-xs font-medium text-sea-500 mr-2">{r.year}년</span>
                  {view === "project" ? r.project : r.category}
                </p>
                <p className="text-sm text-sea-700">
                  예산 {won(r.planned)}원 · 집행 {won(r.spent)}원
                </p>
              </div>
              <Bar planned={r.planned} spent={r.spent} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card mt-4 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-sea-50 text-sea-700">
              <tr>
                {["연도", "사업", "품목", "내용", "예산액", "집행액"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filterYear(items as unknown as Agg[]).map((r) => {
                const it = r as unknown as Item;
                return (
                  <tr key={it.id} className="border-t border-sea-50">
                    <td className="px-3 py-1.5 whitespace-nowrap">{it.year}</td>
                    <td className="px-3 py-1.5">{it.project}</td>
                    <td className="px-3 py-1.5">{it.category}</td>
                    <td className="px-3 py-1.5 text-sea-600">{it.item}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">{won(it.planned)}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">{won(it.spent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
