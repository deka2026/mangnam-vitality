import Link from "next/link";
import { db } from "@/lib/db";
import { usingDefaultPassword } from "@/lib/auth";
import { aiEnabled } from "@/lib/claude";

export const dynamic = "force-dynamic";

function count(sql: string): number {
  return (db().prepare(sql).get() as { n: number }).n;
}

export default function AdminDashboard() {
  const stats = [
    { label: "미답변 문의", value: count("SELECT COUNT(*) n FROM inquiries WHERE answer IS NULL"), href: "/admin/inquiries" },
    { label: "게시된 소식", value: count("SELECT COUNT(*) n FROM posts WHERE published=1"), href: "/admin/posts" },
    { label: "작성한 문서", value: count("SELECT COUNT(*) n FROM docs"), href: "/admin/docs" },
    { label: "사진·영상", value: count("SELECT COUNT(*) n FROM media"), href: "/admin/media" },
    { label: "등록 주민", value: count("SELECT COUNT(*) n FROM residents"), href: "/admin/residents" },
    { label: "예산 항목", value: count("SELECT COUNT(*) n FROM budget_items"), href: "/admin/budget" },
    { label: "문자 발송 이력", value: count("SELECT COUNT(*) n FROM sms_log"), href: "/admin/sms" },
  ];

  const smsReady = !!(process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID && process.env.SMS_SENDER);

  return (
    <>
      <h1 className="text-2xl font-bold text-sea-800">관리자 대시보드</h1>

      {usingDefaultPassword() && (
        <div className="card mt-4 bg-red-50 ring-red-200">
          <p className="text-sm font-medium text-red-700">
            ⚠️ 기본 비밀번호를 사용 중입니다. 서버 환경변수 <code>ADMIN_PASSWORD</code>를
            설정해 주세요. (지미에게 요청)
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card text-center hover:ring-sea-300">
            <p className="text-3xl font-bold text-sea-700">{s.value}</p>
            <p className="mt-1 text-sm text-sea-600">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-bold text-sea-800">🤖 AI 홍보글 생성</h2>
          <p className="mt-1 text-sm text-sea-700">
            {aiEnabled()
              ? "사용 가능 — 보고서를 업로드하면 홍보글 초안을 자동 작성합니다."
              : "미설정 — ANTHROPIC_API_KEY 환경변수가 필요합니다. 설정 전까지는 직접 작성 모드로 동작합니다."}
          </p>
        </div>
        <div className="card">
          <h2 className="font-bold text-sea-800">💬 문자 발송</h2>
          <p className="mt-1 text-sm text-sea-700">
            {smsReady
              ? "사용 가능 — 알리고 API로 실제 발송됩니다."
              : "미설정 — 발송 시뮬레이션(미리보기) 모드로 동작합니다. ALIGO_API_KEY / ALIGO_USER_ID / SMS_SENDER 환경변수가 필요합니다."}
          </p>
        </div>
      </div>
    </>
  );
}
