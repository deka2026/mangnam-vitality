import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "망남생활권 어촌신활력증진사업",
  description:
    "전남광주통합특별시 완도군 망남생활권 어촌신활력증진사업 홍보 및 업무자동화 사이트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <Sidebar />
        <div className="lg:pl-64 min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
          <footer className="border-t border-sea-100 bg-white">
            <div className="container-page py-6 text-xs text-sea-600 flex flex-wrap justify-between gap-2">
              <span>
                © 망남생활권 어촌신활력증진사업 · 전남광주통합특별시 완도군 완도읍 망남리
                <br />
                제작·운영 지원 :{" "}
                <a href="https://sakyowon.co.kr/" className="underline hover:text-sea-900">사회혁신교육원 사회적협동조합</a>
                {" "}· 대전광역시 서구 관저중로80번길 8, 3층
                <br />
                사업자등록번호 397-82-00424 · 사업 : 교육, 컨설팅, IT
              </span>
              <a href="https://sakyowon.co.kr/admin.html" rel="nofollow" className="inline-flex items-center rounded-full border border-sea-200 px-3 py-0.5 hover:bg-sea-50 hover:text-sea-900">🔐 통합 관리자</a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
