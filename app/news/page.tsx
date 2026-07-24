import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Post {
  id: number;
  title: string;
  summary: string | null;
  created_at: string;
}
interface Kpi {
  id: number;
  label: string;
  value: string;
  unit: string | null;
  note: string | null;
}
interface Media {
  id: number;
  kind: string;
  filename: string;
  caption: string | null;
}

export default function NewsPage() {
  const posts = db()
    .prepare(
      "SELECT id, title, summary, created_at FROM posts WHERE published=1 ORDER BY id DESC LIMIT 10"
    )
    .all() as Post[];
  const kpis = db()
    .prepare("SELECT * FROM kpis ORDER BY sort, id")
    .all() as Kpi[];
  const media = db()
    .prepare("SELECT id, kind, filename, caption FROM media ORDER BY id DESC LIMIT 24")
    .all() as Media[];

  return (
    <>
      <section className="bg-sea-50 border-b border-sea-100">
        <div className="container-page py-14">
          <p className="text-sea-600 font-semibold">사업소식</p>
          <h1 className="mt-2 section-title">사업소식 · 성과</h1>
          <p className="section-sub">
            망남생활권 어촌신활력증진사업의 최근 활동 소식과 성과를 전해드립니다.
          </p>
        </div>
      </section>

      {/* KPI 성과 */}
      {kpis.length > 0 && (
        <section className="container-page py-12">
          <h2 className="text-2xl font-bold text-sea-800">📊 사업 성과 한눈에</h2>
          <div className="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.id} className="card text-center">
                <p className="text-3xl font-bold text-sea-700">
                  {k.value}
                  {k.unit && <span className="text-base font-medium text-sea-500 ml-1">{k.unit}</span>}
                </p>
                <p className="mt-1 text-sm font-medium text-sea-800">{k.label}</p>
                {k.note && <p className="mt-1 text-xs text-sea-500">{k.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 블로그형 소식 */}
      <section className="container-page py-12">
        <h2 className="text-2xl font-bold text-sea-800">📰 최근 소식</h2>
        {posts.length === 0 ? (
          <div className="card mt-5 bg-earth-50 ring-earth-200">
            <p className="text-sm text-sea-700">
              아직 등록된 소식이 없습니다. 첫 소식을 준비하고 있어요! 🌊
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {posts.map((p) => (
              <Link key={p.id} href={`/news/${p.id}`} className="card hover:ring-sea-300 transition-shadow">
                <p className="text-xs text-sea-500">{p.created_at.slice(0, 10)}</p>
                <h3 className="mt-1 font-bold text-sea-800 text-lg">{p.title}</h3>
                {p.summary && <p className="mt-2 text-sm text-sea-700 line-clamp-3">{p.summary}</p>}
                <p className="mt-3 text-sm font-medium text-sea-600">자세히 보기 →</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 현장 사진·동영상 */}
      <section className="container-page pb-16">
        <h2 className="text-2xl font-bold text-sea-800">📷 현장 사진 · 영상</h2>
        {media.length === 0 ? (
          <div className="card mt-5 bg-earth-50 ring-earth-200">
            <p className="text-sm text-sea-700">현장 사진과 영상이 곧 올라옵니다.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {media.map((m) => (
              <figure key={m.id} className="rounded-xl overflow-hidden bg-white ring-1 ring-sea-100">
                {m.kind === "video" ? (
                  <video
                    src={`/api/files/${m.filename}`}
                    controls
                    preload="metadata"
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/files/${m.filename}`}
                    alt={m.caption ?? "현장 사진"}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                )}
                {m.caption && (
                  <figcaption className="px-2 py-1.5 text-xs text-sea-600">{m.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
