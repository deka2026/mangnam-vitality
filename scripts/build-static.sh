#!/bin/bash
# 정적 홍보판 빌드 — GitHub Pages(deka2026.github.io/mangnam-vitality)용.
# 서버 전용 라우트(api·admin·login)를 잠시 치우고, force-dynamic을 걷어낸 뒤
# STATIC_EXPORT=1 로 out/ 을 생성한다. 끝나면 원상복구(작업트리를 건드는 건 임시).
set -e
cd "$(dirname "$0")/.."

HOLD=$(mktemp -d)
PATCHED=(app/news/page.tsx "app/news/[id]/page.tsx" app/insta/page.tsx)
restore() {
  for d in api admin login; do
    [ -d "$HOLD/$d" ] && mv "$HOLD/$d" "app/$d"
  done
  local i
  for i in "${!PATCHED[@]}"; do
    [ -f "$HOLD/patched-$i" ] && mv "$HOLD/patched-$i" "${PATCHED[$i]}"
  done
  rm -rf "$HOLD"
}
trap restore EXIT

mv app/api app/admin app/login "$HOLD/"
for i in "${!PATCHED[@]}"; do
  cp "${PATCHED[$i]}" "$HOLD/patched-$i"
done
sed -i '/export const dynamic = "force-dynamic";/d' "${PATCHED[@]}"

rm -rf data/app.db data/app.db-wal data/app.db-shm .next out
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 npx next build

echo "정적 홍보판 생성 완료: out/"
