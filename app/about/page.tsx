import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사업 안내 — 망남생활권 어촌신활력증진사업",
  description:
    "완도 망남리 어촌신활력증진사업의 배경, 단위사업, 운영체계, 걸어온 길을 소개합니다.",
};

const TIMELINE = [
  { date: "2023. 12.", label: "주민리더 회의 — 사업의 첫걸음" },
  { date: "2024. 02.", label: "현장포럼 2회 · 지역협의체 발족식" },
  { date: "2024. 04.", label: "완도군 망남생활권 어촌신활력증진사업 승인" },
  { date: "2024. 05.~07.", label: "리더회의·민간리더 회의·주민협의체 회의" },
  { date: "2024. 06.~09.", label: "전문가 자문 2회 (세종·완도 현장)" },
  { date: "2024. 12.", label: "망남리복지센터 신축 완료 (완도군)" },
  { date: "2025. 01.~10.", label: "기본계획 심의 4회" },
  { date: "2025. 11.", label: "기본계획 수립 (완도군)" },
  { date: "2026.", label: "거점시설(H/W) 완공 목표" },
];

const UNITS = [
  {
    sector: "망남 생활서비스 개선",
    color: "text-sea-700",
    items: [
      {
        name: "교육문화스테이션 조성 (리모델링)",
        desc: "새마을과 본마을 중간의 옛 특산품판매장(연면적 309.6㎡)을 복합문화거점으로 전환. 1층 주민 개방형 망남다목적실, 2층 건강관리실·강의실, 옥상 전망쉼터와 태양광·풍력 에너지 자립 설비, 고령 주민을 위한 엘리베이터까지.",
      },
      {
        name: "망남 건강관리실 운영",
        desc: "걸어서 갈 병원이 없는 마을에 1차 보건 시스템을 만듭니다. 어업 근골격질환 예방 프로그램, 방문보건서비스, 건강관리 전문인력 육성.",
      },
      {
        name: "망남 마을학교 운영",
        desc: "마을지도사 양성, 거점형 마을학교, 에너지 생태 캠프. 완도읍 아동까지 찾아오는 \"망남 로컬만의 마을학교\"를 지향합니다.",
      },
    ],
  },
  {
    sector: "망남 경제활력 창출",
    color: "text-earth-700",
    items: [
      {
        name: "망남활력스테이션 조성 (신축)",
        desc: "1층은 전복양식 실내 공동작업장(분망 등), 2층은 어촌계·영어조합법인의 직거래 거점 어민다목적실. 취수 여건이 좋은 방파제 인접지에 새로 짓습니다.",
      },
      {
        name: "생산자 주도 유통체계 구축",
        desc: "망남전복 판로개척, 마을 브랜딩, 마케팅·가공품 개발. 소득법인을 세워 생산부터 유통까지 마을 내부 네트워크로 완성합니다.",
      },
    ],
  },
  {
    sector: "어항시설 정비",
    color: "text-sea-900",
    items: [
      {
        name: "망남항 방파제 정비",
        desc: "폭 4m뿐인 방파제를 최소 6m로 넓히고 끝단에 회차공간(10m×12m)을 만들며, 테트라포드 보강과 증고로 월파 피해를 막습니다. 재적어선 78척의 안전 — 주민 수요조사에서 가장 필요한 사업으로 꼽혔습니다.",
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="container-page py-12 space-y-14">
      <header>
        <p className="text-sea-600 font-semibold text-sm">사업 안내</p>
        <h1 className="mt-1 text-3xl font-bold text-sea-900">
          바다와 마을을 다시 잇는 4년
        </h1>
        <p className="mt-3 text-sm text-sea-700 max-w-3xl leading-relaxed">
          망남생활권 어촌신활력증진사업은 해양수산부가 지원하고 완도군이
          시행하는 어촌 활성화 사업입니다 (2023~2026, 총사업비 9,213백만
          원 — 국비 6,449.1 · 도비 829.17 · 군비 1,934.73백만 원). 앵커조직인
          사회혁신교육원 사회적협동조합(사교원)이 현장에 상주하며 주민과 함께
          사업을 운영합니다.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-bold text-sea-800">망남리는 어떤 마을인가요</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card">
            <h3 className="font-bold text-sea-800">본낭기미, 만(灣)에 안긴 마을</h3>
            <p className="mt-1 text-sm text-sea-700 leading-relaxed">
              옛 이름은 &lsquo;본낭구미&rsquo;·&lsquo;본낭기미&rsquo; — 동망산 일출전망대 남쪽의
              아늑한 만을 뜻하는 이름입니다. 읍내와 직선거리는 지척이지만 가파른
              산에 막혀 독립된 생활권을 이룬, 완도읍에서 가장 가깝고도 먼
              마을입니다. 145명, 81세대가 삽니다.
            </p>
          </div>
          <div className="card">
            <h3 className="font-bold text-sea-800">완도 전복의 심장</h3>
            <p className="mt-1 text-sm text-sea-700 leading-relaxed">
              완도읍 전복 생산량의 약 80%가 이 마을에서 나옵니다. 가두리
              12,000칸에서 연평균 약 420톤 — 인근에 자생하는 다시마·미역을 직접
              걷어 먹이는 자급자족 양식입니다. 새벽 4~5시에 바다로 나가 오후에
              하루를 마치는 부지런한 마을입니다.
            </p>
          </div>
          <div className="card">
            <h3 className="font-bold text-sea-800">청정 바다와 개머리길</h3>
            <p className="mt-1 text-sm text-sea-700 leading-relaxed">
              해양생태도 1등급 바다를 끼고, 동망산 생태문화탐방로
              &lsquo;개머리길&rsquo;이 마을에서 시작됩니다. 큰개머리곶의 일출·일몰,
              옛 읍민들의 소풍지였던 한뼘 해수욕장 같은 숨은 자원을 품고
              있습니다.
            </p>
          </div>
          <div className="card">
            <h3 className="font-bold text-sea-800">그러나, 사라지는 활력</h3>
            <p className="mt-1 text-sm text-sea-700 leading-relaxed">
              10년 새 인구 29% 감소, 고령화율 46.1%. 병원·학교·문화시설이 없어
              가족은 읍내로 떠나고 종사자만 남는 &lsquo;어촌형 기러기 가구&rsquo;가
              늘었습니다. 버스는 하루 4회 — 이 사업이 망남리의 첫 개발사업입니다.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-sea-800">무엇을 하나요 — 단위사업</h2>
        <div className="mt-4 space-y-6">
          {UNITS.map((u) => (
            <div key={u.sector}>
              <h3 className={`font-bold ${u.color}`}>{u.sector}</h3>
              <div className="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {u.items.map((it) => (
                  <div key={it.name} className="card">
                    <h4 className="font-semibold text-sea-800 text-sm">{it.name}</h4>
                    <p className="mt-1 text-sm text-sea-700 leading-relaxed">{it.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-sea-600">
          거점시설 3개소 체계 — 교육문화스테이션(교육·문화) · 망남활력스테이션(경제) ·
          망남리복지센터(고령층 돌봄, 2024년 완도군 신축).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-sea-800">어떻게 운영하나요</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card">
            <h3 className="font-bold text-sea-800">주민이 결정합니다</h3>
            <p className="mt-1 text-sm text-sea-700 leading-relaxed">
              지역협의체·망남새마을회·망남어촌계·집합주거단지 입주자 대표가
              참여하는 <strong>망남신활력 운영위원회</strong>가 최종 의사결정
              기구입니다. 산하에 생활서비스분과와 경제생태계분과를 두고, 완도군
              어촌신활력팀과 부군수 중심 행정워킹그룹이 뒷받침합니다.
              교육문화스테이션은 망남새마을회가, 전복 공동작업장은
              전복생산장영어조합법인이 운영을 맡습니다.
            </p>
          </div>
          <div className="card">
            <h3 className="font-bold text-sea-800">수익이 마을로 돌아옵니다</h3>
            <p className="mt-1 text-sm text-sea-700 leading-relaxed">
              전복 직거래 유통으로 수익을 만들고(운영 3년차 연 3억 6천만 원
              목표), <strong>수익의 10%를 마을기금으로 적립</strong>해 마을학교와
              건강관리실 같은 생활서비스에 재투자합니다. 경제 → 기금 → 복지 →
              다시 경제로 이어지는 순환이 사업이 끝난 뒤에도 마을을 지탱합니다.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-sea-600">
          기대효과(계획 기준): 생산유발 18,007백만 원 · 부가가치유발 8,630백만 원 ·
          취업유발 118명. 어촌체험휴양마을 지정과 전복체험장 조성도 함께 추진합니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-sea-800">걸어온 길</h2>
        <ol className="mt-4 relative border-l border-sea-200 space-y-4 pl-5">
          {TIMELINE.map((t) => (
            <li key={t.date + t.label}>
              <span
                className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-sea-500"
                aria-hidden
              />
              <p className="text-xs font-semibold text-sea-500">{t.date}</p>
              <p className="text-sm text-sea-800">{t.label}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-sea-500">
        본 내용은 완도군 「망남리 어촌신활력증진사업 기본계획」(2025. 11.) 및
        앵커조직 운영 자료를 바탕으로 작성되었습니다.
      </p>
    </div>
  );
}
