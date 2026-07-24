"use client";

import { useEffect, useState } from "react";
import RelationGraph, { GraphEdge, GraphNode } from "./RelationGraph";

interface Resident extends GraphNode {
  phone: string | null;
  note: string | null;
}

export default function AdminResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [relations, setRelations] = useState<GraphEdge[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"graph" | "list">("graph");

  const load = async () => {
    const res = await fetch("/api/admin/residents");
    if (res.ok) {
      const data = await res.json();
      setResidents(data.residents);
      setRelations(data.relations);
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
    const res = await fetch("/api/admin/residents", { method: "POST", body: form });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(`❌ ${data.error || "업로드 실패"}`);
      return;
    }
    setMsg(`✅ 주민 ${data.residents}명, 관계 ${data.relations}건을 불러왔습니다.`);
    setFile(null);
    (document.getElementById("res-file") as HTMLInputElement).value = "";
    await load();
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">👥 주민 관계도</h1>
      <p className="mt-1 text-sm text-sea-600">
        주민자료 엑셀을 업로드하면 주민 명단과 관계도가 자동으로 만들어집니다. 이
        데이터는 관리자만 볼 수 있습니다.
      </p>

      <div className="card mt-5">
        <h2 className="font-bold text-sea-800">주민자료 엑셀 업로드</h2>
        <p className="mt-1 text-xs text-sea-500">
          명단 시트: <b>이름</b> · 전화번호 · 마을 · 역할 · 비고 (이름 열 필수) /
          관계는 ① 명단에 <b>관계대상·관계유형</b> 열을 두거나 ② 별도 시트에{" "}
          <b>이름1·이름2·관계</b> 열로 작성
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            id="res-file"
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

      <div className="mt-5 flex gap-2">
        {(
          [
            ["graph", "🕸 관계도"],
            ["list", "📋 명단"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === key ? "bg-sea-600 text-white" : "bg-sea-50 text-sea-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {residents.length === 0 ? (
        <div className="card mt-4 bg-earth-50 ring-earth-200 text-sm text-sea-700">
          아직 주민 데이터가 없습니다. 엑셀을 업로드해 주세요.
        </div>
      ) : tab === "graph" ? (
        <div className="mt-4">
          <RelationGraph nodes={residents} edges={relations} />
        </div>
      ) : (
        <div className="card mt-4 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-sea-50 text-sea-700">
              <tr>
                {["이름", "전화번호", "마을", "역할", "비고"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.id} className="border-t border-sea-50">
                  <td className="px-3 py-1.5 font-medium">{r.name}</td>
                  <td className="px-3 py-1.5">{r.phone}</td>
                  <td className="px-3 py-1.5">{r.village}</td>
                  <td className="px-3 py-1.5">{r.role}</td>
                  <td className="px-3 py-1.5 text-sea-600">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
