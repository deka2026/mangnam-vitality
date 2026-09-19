#!/usr/bin/env python3
"""엑셀에서 고친 CSV를 사이트에 되돌려 넣는다.

  python3 scripts/insta-import-csv.py                 # scripts/insta-contents.csv 반영
  python3 scripts/insta-import-csv.py /tmp/insta.csv  # 위치 지정
  python3 scripts/insta-import-csv.py --dry-run       # 무엇이 바뀔지만 보기

줄마다 이렇게 처리한다.
  - id 칸의 번호가 DB에 있으면  → 그 줄을 고친다 (제목을 바꿔도 따라간다)
  - id 가 비어 있으면           → 같은 제목이 있으면 고치고, 없으면 새로 넣는다
  - CSV에서 줄을 지워도 DB에서 지워지지 않는다 (삭제는 관리자 화면에서)

바뀐 게 없는 줄은 건드리지 않으므로, 여러 번 돌려도 안전하다.
"""

import csv
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from insta_db import connect, ENCODING  # noqa: E402

args = [a for a in sys.argv[1:] if a != "--dry-run"]
dry = "--dry-run" in sys.argv
path = args[0] if args else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "insta-contents.csv"
)

if not os.path.exists(path):
    raise SystemExit(f"CSV를 찾지 못했습니다: {path}")


def norm(v):
    v = (v or "").strip()
    return v or None


conn = connect()
cur = conn.cursor()

updated = skipped = inserted = 0

with open(path, encoding=ENCODING, newline="") as f:
    reader = csv.DictReader(f)
    missing = {"title"} - set(reader.fieldnames or [])
    if missing:
        raise SystemExit(f"CSV에 필요한 칸이 없습니다: {', '.join(missing)}")

    for lineno, row in enumerate(reader, start=2):
        title = norm(row.get("title"))
        if not title:
            print(f"  {lineno}행: 제목이 비어 건너뜁니다.")
            continue
        body = norm(row.get("body"))
        insta_url = norm(row.get("insta_url"))
        media_raw = norm(row.get("media_id"))
        media_id = int(float(media_raw)) if media_raw else None
        if media_id == 0:
            media_id = None

        rid_raw = norm(row.get("id"))
        target = None
        if rid_raw:
            rid = int(float(rid_raw))
            if cur.execute("SELECT id FROM insta_contents WHERE id=?", (rid,)).fetchone():
                target = rid
        if target is None:
            hit = cur.execute("SELECT id FROM insta_contents WHERE title=?", (title,)).fetchone()
            if hit:
                target = hit["id"]

        if target is None:
            if not dry:
                cur.execute(
                    "INSERT INTO insta_contents (title, body, media_id, insta_url) VALUES (?,?,?,?)",
                    (title, body, media_id, insta_url),
                )
            inserted += 1
            print(f"  + 새로 넣음: {title}")
            continue

        cur_row = cur.execute(
            "SELECT title, body, media_id, insta_url FROM insta_contents WHERE id=?", (target,)
        ).fetchone()
        if (
            cur_row["title"] == title
            and cur_row["body"] == body
            and cur_row["media_id"] == media_id
            and cur_row["insta_url"] == insta_url
        ):
            skipped += 1
            continue

        if not dry:
            cur.execute(
                "UPDATE insta_contents SET title=?, body=?, media_id=?, insta_url=? WHERE id=?",
                (title, body, media_id, insta_url, target),
            )
        updated += 1
        print(f"  ~ 수정: #{target} {title}")

if dry:
    conn.rollback()
else:
    conn.commit()

total = conn.execute("SELECT COUNT(*) FROM insta_contents").fetchone()[0]
conn.close()

print(
    f"\n{'[미리보기] ' if dry else ''}수정 {updated}건 · 새로 넣음 {inserted}건 · "
    f"그대로 {skipped}건 · 현재 총 {total}건"
)
if not dry:
    print("확인: https://vitality.sakyowon.co.kr/insta")
