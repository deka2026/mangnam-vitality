#!/usr/bin/env bash
# 인스타 홍보콘텐츠 일괄 등록 — node 버전과 무관하게 동작한다.
#
#   bash scripts/import-insta.sh
#
# better-sqlite3는 설치 당시 node 버전으로 컴파일돼 있어, 셸의 node가 다른 버전이면
# import-insta.mjs가 ERR_DLOPEN_FAILED로 죽는다. 이 스크립트는 sqlite3 CLI로 직접 넣으므로
# 그 문제가 없고, 돌아가는 서비스의 node_modules를 건드리지 않는다.
#
# 같은 제목이 이미 있으면 건너뛴다(여러 번 돌려도 중복 생성되지 않음).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$HERE")"

# DATA_DIR: 환경변수 > /etc/mangnam-vitality.env > 앱 폴더의 data/
if [ -z "${DATA_DIR:-}" ] && [ -f /etc/mangnam-vitality.env ]; then
  DATA_DIR="$(grep -E '^DATA_DIR=' /etc/mangnam-vitality.env | tail -1 | cut -d= -f2- | tr -d '"'"'"'' || true)"
fi
DATA_DIR="${DATA_DIR:-$ROOT/data}"
DB="$DATA_DIR/app.db"

if [ ! -f "$DB" ]; then
  echo "DB를 찾지 못했습니다: $DB" >&2
  echo "DATA_DIR 를 확인하거나 DATA_DIR=/경로 bash scripts/import-insta.sh 로 지정해 주세요." >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 CLI가 없습니다. 설치 후 다시 실행해 주세요:  sudo apt -y install sqlite3" >&2
  exit 1
fi

before="$(sqlite3 "$DB" 'SELECT COUNT(*) FROM insta_contents;')"
sqlite3 "$DB" < "$HERE/import-insta.sql"
after="$(sqlite3 "$DB" 'SELECT COUNT(*) FROM insta_contents;')"
echo "새로 등록: $((after - before))건 (이전 ${before}건 → 현재 ${after}건)"
echo "확인: https://vitality.sakyowon.co.kr/insta"
