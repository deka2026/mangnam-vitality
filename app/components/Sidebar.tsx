"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const sections = [
  {
    title: "사업",
    links: [
      { href: "/about", label: "사업 안내" },
      { href: "/news", label: "사업소식·성과" },
      { href: "/insta", label: "인스타 홍보콘텐츠" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 관리자 화면은 자체 레이아웃을 사용
  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `block rounded-md px-3 py-2 text-sm transition-colors ${
      isActive(href)
        ? "bg-sea-600 text-white font-semibold"
        : "text-sea-700 hover:bg-sea-50 hover:text-sea-900"
    }`;

  return (
    <>
      {/* 모바일 상단바 */}
      <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sea-100 bg-white/90 px-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-bold text-sea-800">
          <span className="text-xl">🐟</span>
          <span className="text-sm">망남 어촌신활력</span>
        </Link>
        <button
          aria-label="메뉴 열기"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-sea-700 hover:bg-sea-50"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 좌측 사이드바 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-sea-100 bg-white px-4 py-5 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 font-bold text-sea-900"
          >
            <span className="text-2xl">🐟</span>
            <span className="leading-tight text-sm">
              망남생활권
              <br />
              어촌신활력증진사업
            </span>
          </Link>
          <button
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-sea-600 hover:bg-sea-50 lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-4">
          <Link href="/" onClick={() => setOpen(false)} className={linkClass("/")}>
            🏠 소개·문의
          </Link>
          {sections.map((sec) => (
            <div key={sec.title}>
              <div className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-sea-400">
                {sec.title}
              </div>
              {sec.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={linkClass(l.href)}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}

          <div>
            <div className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-sea-400">
              관련 사이트
            </div>
            <a
              href="https://sakyowon.co.kr/"
              target="_blank"
              rel="noopener"
              className="block rounded-md px-3 py-2 text-sm font-bold text-sea-600 hover:bg-sea-50"
            >
              사교원 사이트 허브 ↗
            </a>
            <a
              href="https://deka2026.github.io/mangnam-coop/"
              target="_blank"
              rel="noopener"
              className="block rounded-md px-3 py-2 text-sm text-sea-600 hover:bg-sea-50"
            >
              망남마을협동조합 ↗
            </a>
          </div>
        </nav>

        {process.env.NEXT_PUBLIC_STATIC !== "1" && (
          <Link
            href="/admin"
            className="btn-outline mt-6 w-full text-sm"
          >
            🔐 관리자 로그인
          </Link>
        )}
      </aside>
    </>
  );
}
