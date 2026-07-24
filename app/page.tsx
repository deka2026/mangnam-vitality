import InquiryForm from "./components/InquiryForm";

const PILLARS = [
  {
    icon: "🍽",
    title: "마을식당 · 편의점",
    desc: "주민·방문객·외국인 근로자가 함께 이용하는 마을 공동 생활 인프라",
  },
  {
    icon: "🤝",
    title: "외국인근로자 지원",
    desc: "전복 양식 현장 외국인 근로자의 생활 지원과 마을 공동체 연결",
  },
  {
    icon: "🏠",
    title: "빈집 임대",
    desc: "빈집을 고쳐 귀어·귀촌인과 워케이션 방문객에게 연결",
  },
  {
    icon: "🎣",
    title: "큰개머리 낚시산장",
    desc: "어촌 자원을 활용한 체류형 관광·낚시 거점 조성",
  },
];

export default function Home() {
  return (
    <>
      <section className="bg-sea-50 border-b border-sea-100">
        <div className="container-page py-16 lg:py-20">
          <p className="text-sea-600 font-semibold">전라남도 완도군 · 어촌신활력증진사업</p>
          <h1 className="mt-2 section-title">
            망남생활권
            <br />
            어촌신활력증진사업
          </h1>
          <p className="section-sub">
            바다와 함께 살아온 완도 망남생활권에 새로운 활력을 불어넣습니다. 마을의
            생활 인프라를 되살리고, 주민의 소득을 만들고, 찾아오는 어촌을 함께
            가꾸는 사업입니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#inquiry" className="btn-primary">
              방문·사업 문의하기
            </a>
            <a href="/news" className="btn-outline">
              사업소식 보기 →
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-2xl font-bold text-sea-800">무엇을 하는 사업인가요?</h2>
        <p className="mt-2 text-sm text-sea-700 max-w-2xl">
          어촌신활력증진사업은 해양수산부가 지원하는 어촌 활성화 사업입니다. 망남생활권은
          주민이 주체가 되어 아래 네 가지 사업을 추진하고 있습니다.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="card">
              <p className="text-2xl" aria-hidden>{p.icon}</p>
              <h3 className="mt-2 font-bold text-sea-800">{p.title}</h3>
              <p className="mt-1 text-sm text-sea-700">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-sea-600">
          ※ 각 사업의 자세한 내용은{" "}
          <a
            href="https://deka2026.github.io/mangnam-coop/"
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
