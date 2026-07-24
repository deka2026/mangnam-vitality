"use client";

import { useEffect, useMemo, useState } from "react";

interface Resident {
  id: number;
  name: string;
  phone: string | null;
  village: string | null;
  role: string | null;
}
interface LogRow {
  id: number;
  recipients: string;
  message: string;
  status: string;
  detail: string | null;
  created_at: string;
}

export default function AdminSms() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [log, setLog] = useState<LogRow[]>([]);
  const [configured, setConfigured] = useState(false);
  const [villageFilter, setVillageFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [r1, r2] = await Promise.all([
      fetch("/api/admin/residents"),
      fetch("/api/admin/sms"),
    ]);
    if (r1.ok) setResidents((await r1.json()).residents);
    if (r2.ok) {
      const data = await r2.json();
      setLog(data.log);
      setConfigured(data.configured);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const withPhone = useMemo(
    () => residents.filter((r) => r.phone && r.phone.replace(/[^0-9]/g, "").length >= 9),
    [residents]
  );
  const villages = useMemo(
    () => Array.from(new Set(withPhone.map((r) => r.village || "미지정"))),
    [withPhone]
  );
  const shown = withPhone.filter(
    (r) => villageFilter === "all" || (r.village || "미지정") === villageFilter
  );

  const toggle = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const selectAllShown = () => {
    const next = new Set(selected);
    const allSelected = shown.every((r) => next.has(r.id));
    shown.forEach((r) => (allSelected ? next.delete(r.id) : next.add(r.id)));
    setSelected(next);
  };

  const send = async () => {
    const recipients = withPhone
      .filter((r) => selected.has(r.id))
      .map((r) => ({ name: r.name, phone: r.phone! }));
    if (!recipients.length) {
      setMsg("받는 사람을 선택해 주세요.");
      return;
    }
    if (!message.trim()) {
      setMsg("문자 내용을 입력해 주세요.");
      return;
    }
    if (
      !confirm(
        `${recipients.length}명에게 문자를 ${configured ? "발송" : "발송 기록(시뮬레이션)"}할까요?`
      )
    )
      return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients, message }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(`❌ ${data.error || "발송 실패"}`);
      return;
    }
    setMsg(`✅ ${data.detail}`);
    setMessage("");
    setSelected(new Set());
    await load();
  };

  const bytes = new Blob([message]).size;

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">💬 문자 발송</h1>
      <p className="mt-1 text-sm text-sea-600">
        주민 관계도 메뉴에 업로드된 연락처를 바탕으로 단체 문자를 보냅니다.
      </p>

      {!configured && (
        <div className="card mt-4 bg-earth-50 ring-earth-200">
          <p className="text-sm text-sea-700">
            ⚠️ SMS API가 아직 설정되지 않아 <b>시뮬레이션 모드</b>로 동작합니다. 발송
            내용은 기록만 되고 실제 문자는 나가지 않습니다. (환경변수 ALIGO_API_KEY,
            ALIGO_USER_ID, SMS_SENDER 필요 — 지미에게 요청)
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* 받는 사람 */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sea-800">받는 사람 ({selected.size}명 선택)</h2>
            <button className="text-sm text-sea-600 hover:underline" onClick={selectAllShown}>
              표시된 전체 선택/해제
            </button>
          </div>
          <select
            className="input mt-3 w-auto py-1.5 text-sm"
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
          >
            <option value="all">전체 마을</option>
            {villages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {withPhone.length === 0 ? (
            <p className="mt-3 text-sm text-sea-600">
              전화번호가 있는 주민이 없습니다. 먼저 주민자료 엑셀을 업로드해 주세요.
            </p>
          ) : (
            <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto">
              {shown.map((r) => (
                <li key={r.id}>
                  <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sea-50">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                    <span className="font-medium text-sea-900">{r.name}</span>
                    <span className="text-sea-600">{r.phone}</span>
                    {r.village && <span className="text-xs text-sea-400">{r.village}</span>}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 내용 */}
        <div className="card">
          <h2 className="font-bold text-sea-800">문자 내용</h2>
          <textarea
            className="input mt-3"
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="[망남마을] 이번 주 토요일 마을회관에서 주민 설명회가 열립니다..."
          />
          <p className="mt-1 text-xs text-sea-500">
            {bytes}바이트 · {bytes > 90 ? "LMS(장문)" : "SMS(단문)"}로 발송
          </p>
          {msg && <p className="mt-2 text-sm text-sea-700">{msg}</p>}
          <button className="btn-primary mt-3" onClick={send} disabled={busy}>
            {busy ? "발송 중..." : configured ? "문자 발송" : "발송 기록 (시뮬레이션)"}
          </button>
        </div>
      </div>

      {/* 발송 이력 */}
      <h2 className="mt-8 text-lg font-bold text-sea-800">발송 이력</h2>
      <div className="mt-3 space-y-2">
        {log.map((l) => {
          const recipients = JSON.parse(l.recipients) as { name: string }[];
          return (
            <div key={l.id} className="card py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    l.status === "sent"
                      ? "bg-sea-100 text-sea-700"
                      : l.status === "simulated"
                        ? "bg-earth-100 text-earth-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {l.status === "sent" ? "발송됨" : l.status === "simulated" ? "시뮬레이션" : "실패"}
                </span>
                <span className="text-xs text-sea-500">{l.created_at}</span>
              </div>
              <p className="mt-2 text-sm text-sea-800 whitespace-pre-line">{l.message}</p>
              <p className="mt-1 text-xs text-sea-500">
                받는 사람 {recipients.length}명: {recipients.map((r) => r.name).slice(0, 8).join(", ")}
                {recipients.length > 8 && " 외"}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
