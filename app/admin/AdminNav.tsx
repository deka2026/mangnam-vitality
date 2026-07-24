"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin", label: "🏠 대시보드" },
  { href: "/admin/inquiries", label: "📨 문의 관리" },
  { href: "/admin/posts", label: "📰 소식·홍보글" },
  { href: "/admin/kpis", label: "📊 KPI 성과" },
  { href: "/admin/media", label: "📷 사진·영상" },
  { href: "/admin/insta", label: "📸 인스타 콘텐츠" },
  { href: "/admin/budget", label: "💰 예산 집행실적" },
  { href: "/admin/residents", label: "👥 주민 관계도" },
  { href: "/admin/sms", label: "💬 문자 발송" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const linkClass = (href: string) => {
    const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
    return `block rounded-md px-3 py-2 text-sm transition-colors ${
      active
        ? "bg-sea-600 text-white font-semibold"
        : "text-sea-700 hover:bg-sea-50 hover:text-sea-900"
    }`;
  };

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sea-100 bg-white/90 px-4 backdrop-blur">
        <span className="font-bold text-sea-800 text-sm">⚙️ 망남 관리자</span>
        <button
          aria-label="메뉴 열기"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-sea-700 hover:bg-sea-50"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-sea-100 bg-white px-4 py-5 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="font-bold text-sea-900 text-sm leading-tight">
            ⚙️ 망남 어촌신활력
            <br />
            관리자
          </span>
          <button
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-sea-600 hover:bg-sea-50 lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 space-y-2">
          <Link href="/" className="btn-outline w-full text-sm">
            공개 사이트 보기
          </Link>
          <button onClick={logout} className="w-full rounded-md px-3 py-2 text-sm text-sea-500 hover:bg-sea-50">
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
