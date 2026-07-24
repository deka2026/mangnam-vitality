import { db, getSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

interface InstaContent {
  id: number;
  title: string;
  body: string | null;
  media_id: number | null;
  insta_url: string | null;
  created_at: string;
  filename: string | null;
  kind: string | null;
}

export default function InstaPage() {
  const items = db()
    .prepare(
      `SELECT ic.*, m.filename, m.kind
       FROM insta_contents ic LEFT JOIN media m ON m.id = ic.media_id
       ORDER BY ic.id DESC LIMIT 30`
    )
    .all() as InstaContent[];
  const instaAccount = getSetting("insta_account");

  return (
    <>
      <section className="bg-sea-50 border-b border-sea-100">
        <div className="container-page py-14">
          <p className="text-sea-600 font-semibold">홍보</p>
          <h1 className="mt-2 section-title">인스타 홍보콘텐츠</h1>
          <p className="section-sub">
            망남마을의 일상과 사업 현장을 인스타그램 콘텐츠로 만나보세요.
          </p>
          {instaAccount && (
            <a
              href={`https://www.instagram.com/${instaAccount.replace(/^@/, "")}/`}
              target="_blank"
              rel="noopener"
              className="btn-primary mt-5"
            >
              📸 인스타그램 방문하기 →
            </a>
          )}
        </div>
      </section>

      <section className="container-page py-12">
        {items.length === 0 ? (
          <div className="card bg-earth-50 ring-earth-200">
            <p className="text-sm text-sea-700">
              홍보 콘텐츠를 준비하고 있습니다. 곧 망남마을의 생생한 소식을 만나보실 수
              있어요! 📸
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <div key={it.id} className="card p-0 overflow-hidden">
                {it.filename &&
                  (it.kind === "video" ? (
                    <video
                      src={`/api/files/${it.filename}`}
                      controls
                      preload="metadata"
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/files/${it.filename}`}
                      alt={it.title}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                  ))}
                <div className="p-4">
                  <h3 className="font-bold text-sea-800">{it.title}</h3>
                  {it.body && (
                    <p className="mt-1 text-sm text-sea-700 whitespace-pre-line">{it.body}</p>
                  )}
                  {it.insta_url && (
                    <a
                      href={it.insta_url}
                      target="_blank"
                      rel="noopener"
                      className="mt-2 inline-block text-sm font-medium text-sea-600 hover:underline"
                    >
                      인스타에서 보기 →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
