"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "로그인에 실패했습니다.");
    }
  };

  return (
    <div className="container-page py-20 max-w-md">
      <div className="card">
        <h1 className="text-xl font-bold text-sea-800">🔐 관리자 로그인</h1>
        <p className="mt-1 text-sm text-sea-600">
          사업 관리자만 접근할 수 있는 화면입니다.
        </p>
        <form onSubmit={submit} className="mt-5">
          <label className="label">비밀번호</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button className="btn-primary mt-4 w-full" disabled={busy}>
            {busy ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
