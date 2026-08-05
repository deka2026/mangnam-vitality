#!/usr/bin/env bash
# 데카 위키·자료함의 망남 관련 텍스트를 data/knowledge/ 로 동기화한다.
# data/ 는 gitignore 영역(공개 레포이므로 원문은 커밋하지 않음) — 서버에서는
# data/knowledge/ 에 같은 파일들을 직접 넣어 주면 된다 (핸드오버·지미 편지 참고).
#
# 원본 위치 (데카 로컬):
#   ~/workspace/mangnam-jaryo-files/txt/  — 기본계획서(hwp) 장별 추출 텍스트 등
#   ~/workspace/sakyowon-wiki/content/    — 공동위키 망남 문서
set -euo pipefail

SRC_TXT="$HOME/workspace/mangnam-jaryo-files/txt"
SRC_WIKI="$HOME/workspace/sakyowon-wiki/content"
DEST="$(cd "$(dirname "$0")/.." && pwd)/data/knowledge"
mkdir -p "$DEST"

# 추출 시 한글 파일명이 소실된 jaryo 텍스트 → 내용 기준으로 식별한 이름 매핑
# (근태기록 등 개인정보성 내부행정 자료는 제외)
declare -A MAP=(
  ["1._.txt"]="기본계획-01-추진배경및목적.txt"
  ["2._.txt"]="기본계획-02-일반현황.txt"
  ["3._.txt"]="기본계획-03-어촌생활권분석.txt"
  ["4._.txt"]="기본계획-04-생활서비스-경제생태계.txt"
  ["5._.txt"]="기본계획-05-단위사업종합계획.txt"
  ["6._.txt"]="기본계획-06-교육문화스테이션.txt"
  ["7._HW._.txt"]="기본계획-07-어항시설정비.txt"
  ["8._.txt"]="기본계획-08-사업운영계획.txt"
  ["9._.txt"]="기본계획-09-회의록.txt"
  ["2023운영계획서.txt"]="2023-앵커조직-운영계획서.txt"
  ["5.2.24._._._20250514.txt"]="2025-현황및주요업무.txt"
  ["2.2024._._._._._20250513.txt"]="2024-비목변경-세부내역.txt"
  ["4.24.txt"]="2024-세목변경-승인.txt"
  ["_._20251026.txt"]="보조금-집행점검-관련.txt"
  ["_0301.txt"]="링커간담회-공문.txt"
  ["1._._._._._.txt"]="사회혁신프로그램-공문.txt"
  ["전복공동구매계획.txt"]="사회혁신실험-전복공동구매-계획.txt"
  ["전복공동구매결과.txt"]="사회혁신실험-전복공동구매-결과.txt"
  ["링커활동.txt"]="링커활동.txt"
)

for src in "${!MAP[@]}"; do
  if [ -f "$SRC_TXT/$src" ]; then
    cp "$SRC_TXT/$src" "$DEST/${MAP[$src]}"
  else
    echo "누락: $SRC_TXT/$src" >&2
  fi
done

cp "$SRC_WIKI/전남광주/망남마을-기본계획.md" "$DEST/위키-망남마을-기본계획-요약.md"
cp "$SRC_WIKI/전남광주/로컬리스트-원본_완도(망남앵커).md" "$DEST/위키-로컬리스트-완도망남.md"
cp "$SRC_WIKI/전남광주/망남마을-홍보페이지.md" "$DEST/위키-망남마을-홍보페이지.md" 2>/dev/null || true
cp "$SRC_WIKI/망남-신활력/망남-신활력-사이트.md" "$DEST/위키-망남신활력-사이트.md" 2>/dev/null || true

echo "동기화 완료 → $DEST"
ls -la "$DEST" | tail -n +2 | wc -l
