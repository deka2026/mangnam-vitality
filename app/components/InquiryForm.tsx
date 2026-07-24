"use client";

import { useState } from "react";

const KINDS = ["방문", "사업", "기타"] as const;

export default function InquiryForm() {
  const [kind, setKind] = useState<string>("방문");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("이름, 전화번호, 문의 내용을 입력해 주세요.");
      return;
    }
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name, phone, email, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "접수에 실패했습니다.");
      }
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "접수에 실패했습니다.");
    }
  };

  if (state === "done") {
    return (
      <div className="card bg-sea-50 ring-sea-200 text-center py-10">
        <p className="text-3xl">✅</p>
        <h3 className="mt-3 font-bold text-sea-800 text-lg">문의가 접수되었습니다</h3>
        <p className="mt-2 text-sm text-sea-700">
          담당자가 확인 후 입력하신 연락처로 답변드리겠습니다.
        </p>
        <button
          className="btn-outline mt-5"
          onClick={() => {
            setState("idle");
            setName("");
            setPhone("");
            setEmail("");
            setMessage("");
          }}
        >
          추가 문의하기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card">
      <h3 className="font-bold text-sea-800 text-lg">방문·사업 문의</h3>
      <p className="mt-1 text-sm text-sea-600">
        마을 방문, 사업 내용, 협력 제안 등 무엇이든 남겨 주세요.
      </p>

      <div className="mt-5 flex gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              kind === k
                ? "bg-sea-600 text-white"
                : "bg-sea-50 text-sea-700 hover:bg-sea-100"
            }`}
          >
            {k === "방문" ? "🚌 방문 문의" : k === "사업" ? "📋 사업 문의" : "💬 기타"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">이름 *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
        </div>
        <div>
          <label className="label">전화번호 *</label>
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">이메일 (선택)</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">문의 내용 *</label>
          <textarea
            className="input"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="방문 희망 날짜와 인원, 궁금한 사업 내용 등을 자유롭게 적어 주세요."
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <button type="submit" className="btn-primary mt-5 w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? "접수 중..." : "문의 접수하기"}
      </button>
    </form>
  );
}
