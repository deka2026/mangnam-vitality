"use client";

import { useEffect, useState } from "react";

interface Media {
  id: number;
  kind: string;
  filename: string;
  original_name: string | null;
  caption: string | null;
  created_at: string;
}

export default function AdminMedia() {
  const [items, setItems] = useState<Media[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/media");
    if (res.ok) setItems((await res.json()).media);
  };
  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    if (!files?.length) {
      setError("파일을 선택해 주세요.");
      return;
    }
    setError("");
    setBusy(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    if (caption) form.set("caption", caption);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "업로드 실패");
      return;
    }
    setFiles(null);
    setCaption("");
    (document.getElementById("media-files") as HTMLInputElement).value = "";
    await load();
  };

  const updateCaption = async (id: number, cap: string) => {
    await fetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: cap }),
    });
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm("이 파일을 삭제할까요?")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">📷 현장 사진·영상 관리</h1>
      <p className="mt-1 text-sm text-sea-600">
        업로드한 사진·영상은 사업소식 페이지 하단 갤러리에 표시됩니다.
      </p>

      <div className="card mt-5">
        <div className="space-y-3">
          <input
            id="media-files"
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onChange={(e) => setFiles(e.target.files)}
            className="block text-sm text-sea-700"
          />
          <input
            className="input"
            placeholder="설명 (선택, 함께 올린 파일 전체에 적용)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary" onClick={upload} disabled={busy}>
            {busy ? "업로드 중..." : "업로드"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <div key={m.id} className="rounded-xl overflow-hidden bg-white ring-1 ring-sea-100">
            {m.kind === "video" ? (
              <video src={`/api/files/${m.filename}`} controls preload="metadata" className="w-full aspect-square object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/files/${m.filename}`} alt={m.caption ?? ""} className="w-full aspect-square object-cover" loading="lazy" />
            )}
            <div className="p-2">
              <input
                className="w-full rounded border border-sea-100 px-2 py-1 text-xs"
                defaultValue={m.caption ?? ""}
                placeholder="설명..."
                onBlur={(e) => {
                  if (e.target.value !== (m.caption ?? "")) updateCaption(m.id, e.target.value);
                }}
              />
              <button className="mt-1 text-xs text-red-500 hover:underline" onClick={() => remove(m.id)}>
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
