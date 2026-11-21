#!/usr/bin/env python3
"""보관 기한이 지난 개인정보 줄을 지운다 — 하루 한 번(systemd user 타이머 mangnam-vitality-retention).

- inquiries(방문·사업 문의): 접수일(created_at)로부터 1년 지난 줄
- sms_log(단체 문자 발송 기록 — 받는 사람 이름·전화번호): 보낸 날(created_at)로부터 1년 지난 줄
- residents·resident_relations(주민 명단): 「사업 종료 때까지」라 자동 삭제하지 않는다.
created_at 은 앱이 datetime('now','localtime')(한국 시각)으로 적으므로 같은 기준으로 비교한다.

쓰는 법: retention.py [--db 경로] [--dry-run]   (기본 DB: DATA_DIR 또는 이 폴더의 ../data/app.db)
출력은 지운 건수만(본문·이름·전화는 찍지 않는다).
2026-11-21 데카 — 이사장 결정(문의 1년·문자 기록 1년).
"""
import argparse
import os
import sqlite3
import sys
import time

규칙 = [  # (표, 날짜 칸, 보관 기간 — sqlite datetime 수식어)
    ("inquiries", "created_at", "-1 year"),
    ("sms_log", "created_at", "-1 year"),
]


def main():
    ap = argparse.ArgumentParser()
    기본 = os.path.join(os.environ.get("DATA_DIR") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data"), "app.db")
    ap.add_argument("--db", default=기본)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not os.path.exists(a.db):
        print(f"DB 없음: {a.db}", file=sys.stderr)
        return 1
    con = sqlite3.connect(a.db, timeout=30)
    con.execute("PRAGMA busy_timeout=30000")
    있는표 = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    결과 = []
    with con:
        for 표, 칸, 기간 in 규칙:
            if 표 not in 있는표:
                결과.append(f"{표}=표없음")
                continue
            조건 = f"{칸} < datetime('now','localtime','{기간}')"
            n = con.execute(f"SELECT COUNT(*) FROM {표} WHERE {조건}").fetchone()[0]
            if n and not a.dry_run:
                con.execute(f"DELETE FROM {표} WHERE {조건}")
            결과.append(f"{표}={n}")
    con.close()
    print(time.strftime("%Y-%m-%d %H:%M:%S"), ("[시험] 지울 건수 " if a.dry_run else "지운 건수 ") + " ".join(결과))
    return 0


if __name__ == "__main__":
    sys.exit(main())
