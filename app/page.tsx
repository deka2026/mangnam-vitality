import Link from "next/link";
import InquiryForm from "./components/InquiryForm";

const STATS = [
  { value: "2023~2026", label: "사업기간 (4개년)" },
  { value: "92.1억 원", label: "총사업비 (국비 70%)" },
  { value: "3개소", label: "거점시설 (스테이션 체계)" },
  { value: "78척", label: "망남항 재적어선" },
];

const SECTORS = [
  {
    icon: "🏫",
    title: "생활서비스 개선",
    items: [
      "교육문화스테이션 조성 — 방치된 특산품판매장을 전 연령 교육·문화 거점으로 리모델링",
      "망남 건강관리실 — 어업 근골격질환 예방·방문보건 등 1차 보건서비스",
      "망남 마을학교 — 완도읍 아동까지 품는 거점형 교육·평생학습",
    ],
  },
  {
    icon: "🐚",
    title: "경제활력 창출",
    items: [
      "망남활력스테이션 신축 — 1층 전복 공동작업장, 2층 직거래 거점 어민다목적실",
      "생산자 주도 유통체계 — 망남전복 판로개척·브랜딩·가공품 개발",
      "전복 생산–가공–체험을 잇는 6차산업화",
    ],
  },
  {
    icon: "⚓",
    title: "어항시설 정비",
    items: [
      "망남항 방파제 폭 확장(4m → 최소 6m)과 끝단 회차공간 조성",
      "테트라포드 보강·증고로 월파 피해 예방",
      "78척 어선의 안전한 작업환경 — 주민 수요조사 1순위 사업",
    ],
  },
];

export default function Home() {
  return (
    <>
      <section className="bg-sea-50 border-b border-sea-100">
        <div className="container-page py-16 lg:py-20">
          <p className="text-sea-600 font-semibold">해양수산부 어촌신활력증진사업 · 전남광주통합특별시 완도군</p>
          <h1 className="mt-2 section-title">
            망남생활권
            <br />
            어촌신활력증진사업
          </h1>
          <p className="section-sub">
            완도읍 전복 생산량의 약 80%를 책임지는 마을, 망남리. 주민이 주도하고
            완도군이 시행하며 앵커조직 사회혁신교육원(사교원)이 함께 운영하는
            4개년 사업으로, 전국 어촌 신활력 창출의 성공모델에 도전합니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/about" className="btn-primary">
              사업 안내 보기
            </Link>
            <Link href="/news" className="btn-outline">
              사업소식·성과 →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-sea-100 bg-white">
        <div className="container-page py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-sea-800">{s.value}</p>
              <p className="mt-1 text-xs text-sea-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-2xl font-bold text-sea-800">세 가지 축으로 마을을 바꿉니다</h2>
        <p className="mt-2 text-sm text-sea-700 max-w-2xl">
          생활서비스·경제·어항 기반을 함께 개선하고, 경제활동 수익의 10%를
          마을기금으로 되돌려 생활서비스에 재투자하는 순환 구조를 만듭니다.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {SECTORS.map((s) => (
            <div key={s.title} className="card">
              <p className="text-2xl" aria-hidden>{s.icon}</p>
              <h3 className="mt-2 font-bold text-sea-800">{s.title}</h3>
              <ul className="mt-2 space-y-2 text-sm text-sea-700 list-disc list-inside">
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-sea-600">
          ※ 마을 주민 조직의 자체 사업은{" "}
          <a
            href="https://sakyowon.co.kr/mangnam-coop/"
            target="_blank"
            rel="noopener"
            className="underline"
          >
            망남마을협동조합 사이트
          </a>
          에서 확인하실 수 있습니다.
        </p>
      </section>

      <section id="inquiry" className="container-page pb-16">
        <InquiryForm />
      </section>
    </>
  );
}
