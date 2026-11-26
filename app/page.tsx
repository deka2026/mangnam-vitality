import Link from "next/link";
import InquiryForm from "./components/InquiryForm";
import RegionTabs from "./components/RegionTabs";
import { normRegion, type Region } from "@/lib/region";
import { db } from "@/lib/db";
import { asset } from "@/lib/asset";

export const dynamic = "force-dynamic";

const CONTENT: Record<Region, {
  badge: string; title: string; sub: string;
  stats: { value: string; label: string }[];
  sectorsTitle?: string; sectorsSub?: string;
  sectors?: { icon: string; title: string; items: string[]; img?: string; alt?: string }[];
  note?: string;
  hero: { img: string; alt: string; cap: string };
  gallery?: { img: string; alt: string; cap: string }[];
}> = {
  망남: {
    badge: "해양수산부 어촌신활력증진사업 · 전남광주통합특별시 완도군",
    title: "완도 망남생활권 어촌신활력증진사업",
    sub: "완도읍 전복 생산량의 약 80%를 책임지는 마을, 망남리. 주민이 주도하고 완도군이 시행하며 앵커조직 사회혁신교육원사회적협동조합(사교원)이 함께 운영하는 4개년 사업으로, 전국 어촌 신활력 창출의 성공모델에 도전합니다.",
    stats: [
      { value: "2023~2026", label: "사업기간 (4개년)" },
      { value: "92.1억 원", label: "총사업비 (국비 70%)" },
      { value: "3개소", label: "거점시설 (스테이션 체계)" },
      { value: "78척", label: "망남항 재적어선" },
    ],
    sectorsTitle: "세 가지 축으로 마을을 바꿉니다",
    sectorsSub: "생활서비스·경제·어항 기반을 함께 개선하고, 경제활동 수익의 10%를 마을기금으로 되돌려 생활서비스에 재투자하는 순환 구조를 만듭니다.",
    hero: { img: "/img/mangnam-port-aerial-02.jpg", alt: "하늘에서 본 망남항과 전복 양식장", cap: "하늘에서 본 망남항과 앞바다 양식장" },
    sectors: [
      { icon: "🏫", title: "생활서비스 개선", img: "/img/mangnam-village-seaview-01.jpg", alt: "언덕에서 본 망남 마을과 바다", items: [
        "교육문화스테이션 조성 — 방치된 특산품판매장을 전 연령 교육·문화 거점으로 리모델링",
        "망남 건강관리실 — 어업 근골격질환 예방·방문보건 등 1차 보건서비스",
        "망남 마을학교 — 완도읍 아동까지 품는 거점형 교육·평생학습",
      ]},
      { icon: "🐚", title: "경제활력 창출", img: "/img/mangnam-abalone-shells-01.jpg", alt: "망남 앞바다에서 들어 올린 전복 가두리", items: [
        "망남활력스테이션 신축 — 1층 전복 공동작업장, 2층 직거래 거점 어민다목적실",
        "생산자 주도 유통체계 — 망남전복 판로개척·브랜딩·가공품 개발",
        "전복 생산–가공–체험을 잇는 6차산업화",
      ]},
      { icon: "⚓", title: "어항시설 정비", img: "/img/mangnam-port-breakwater-01.jpg", alt: "망남항 방파제와 가두리 양식장", items: [
        "망남항 방파제 폭 확장(4m → 최소 6m)과 끝단 회차공간 조성",
        "테트라포드 보강·증고로 월파 피해 예방",
        "78척 어선의 안전한 작업환경 — 주민 수요조사 1순위 사업",
      ]},
    ],
    note: "※ 마을 주민 조직의 자체 사업은 <a href=\"https://sakyowon.co.kr/mangnam-coop/\" target=\"_blank\" rel=\"noopener\" class=\"underline\">망남마을협동조합 사이트</a>에서 확인하실 수 있습니다.",
  },
  양양: {
    badge: "해양수산부 어촌신활력증진사업 · 강원특별자치도 양양군",
    title: "양양 어촌신활력증진사업",
    sub: "강원 양양군에서 추진하는 어촌신활력증진사업입니다. 앵커조직 사회혁신교육원사회적협동조합(사교원)이 사업 운영을 맡아 생활서비스·경제활력·어촌 기반을 함께 키워 갑니다. 아래 소식·성과와 예산 집행 현황은 실제 운영 자료로 채워집니다.",
    stats: [
      { value: "강원 양양군", label: "사업지" },
      { value: "2026", label: "운영 연차" },
      { value: "앵커조직 사교원", label: "운영 주체" },
      { value: "진행 중", label: "사업 단계" },
    ],
    hero: { img: "/img/yangyang-hujin-stairs-01.jpg", alt: "양양 후진항 바닷가 계단길", cap: "양양 후진항 바닷가(견학 때 촬영)" },
    gallery: [
      { img: "/img/yangyang-hujin-fishcenter-night-01.jpg", alt: "양양 후진항 활어센터 밤 풍경", cap: "후진항 활어센터(견학 때 촬영)" },
    ],
    note: "※ 양양 사업은 2026년 운영·예산 집행 현황과 사업 소식을 안내합니다. 궁금한 점은 아래 문의로 남겨 주세요.",
  },
};

export default function Home({ searchParams }: { searchParams?: { region?: string } }) {
  const region = normRegion(searchParams?.region);
  const c = CONTENT[region];
  const q = region === "망남" ? "" : `?region=${region}`;
  // 양양 등 DB 자료가 있는 지역은 집행 합계를 간단히 보여 준다
  let execTotal = 0;
  try {
    execTotal = (db().prepare("SELECT COALESCE(SUM(spent),0) n FROM budget_items WHERE region=?").get(region) as { n: number }).n;
  } catch {}
  return (
    <>
      <section className="bg-sea-50 border-b border-sea-100">
        <div className="container-page py-6"><RegionTabs region={region} base="/" /></div>
        <div className="container-page pb-12 lg:pb-16 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sea-600 font-semibold">{c.badge}</p>
            <h1 className="mt-2 section-title [word-break:keep-all]">{c.title}</h1>
            <p className="section-sub">{c.sub}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/about${q}`} className="btn-primary">사업 안내 보기</Link>
              <Link href={`/news${q}`} className="btn-outline">사업소식·성과 →</Link>
              {!c.sectors && <a href="#inquiry" className="btn-outline">문의하기</a>}
            </div>
          </div>
          <figure className="m-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(c.hero.img)} alt={c.hero.alt} className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-sea-100" />
            <figcaption className="mt-2 text-xs text-sea-500">{c.hero.cap}</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-sea-100 bg-white">
        <div className="container-page py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {c.stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-sea-800">{s.value}</p>
              <p className="mt-1 text-xs text-sea-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {c.sectors && (
        <section className="container-page py-14">
          <h2 className="text-2xl font-bold text-sea-800">{c.sectorsTitle}</h2>
          <p className="mt-2 text-sm text-sea-700 max-w-2xl">{c.sectorsSub}</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {c.sectors.map((s) => (
              <div key={s.title} className="card overflow-hidden">
                {s.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset(s.img)} alt={s.alt || ""} className="-mx-6 -mt-6 mb-4 block w-[calc(100%+3rem)] max-w-none aspect-[16/9] object-cover" />
                )}
                <p className="text-2xl" aria-hidden>{s.icon}</p>
                <h3 className="mt-2 font-bold text-sea-800">{s.title}</h3>
                <ul className="mt-2 space-y-2 text-sm text-sea-700 list-disc list-inside">
                  {s.items.map((it) => (<li key={it}>{it}</li>))}
                </ul>
              </div>
            ))}
          </div>
          {c.note && <p className="mt-4 text-xs text-sea-600" dangerouslySetInnerHTML={{ __html: c.note }} />}
        </section>
      )}

      {!c.sectors && (
        <section className="container-page py-14">
          <div className="card">
            <h3 className="font-bold text-sea-800">2026년 운영 현황</h3>
            {execTotal > 0 ? (
              <p className="mt-2 text-sm text-sea-700">
                올해 예산 집행액은 <b>{execTotal.toLocaleString()}원</b>입니다(e나라도움 기준). 자세한 비목별
                집행과 사업 소식은 <Link href={`/news${q}`} className="underline">사업소식·성과</Link>에서 보실 수 있습니다.
              </p>
            ) : (
              <p className="mt-2 text-sm text-sea-700">운영 자료를 준비하고 있습니다.</p>
            )}
            {c.note && <p className="mt-3 text-xs text-sea-600">{c.note}</p>}
          </div>
          {c.gallery && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {c.gallery.map((g) => (
                <figure key={g.img} className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(g.img)} alt={g.alt} className="w-full aspect-[4/3] object-cover rounded-2xl ring-1 ring-sea-100" />
                  <figcaption className="mt-2 text-xs text-sea-500">{g.cap}</figcaption>
                </figure>
              ))}
              <div className="card flex flex-col justify-center">
                <h3 className="font-bold text-sea-800">양양 사업이 궁금하신가요</h3>
                <p className="mt-2 text-sm text-sea-700">방문·협력·사업 내용에 대한 문의를 남겨 주시면 앵커조직 사교원 담당자가 확인한 뒤 연락드립니다.</p>
                <a href="#inquiry" className="btn-primary mt-4 self-start">양양 사업 문의하기</a>
              </div>
            </div>
          )}
        </section>
      )}

      <section id="inquiry" className="container-page pb-16">
        <InquiryForm />
      </section>
    </>
  );
}
