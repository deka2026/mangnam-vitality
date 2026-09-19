#!/usr/bin/env python3
"""인스타 콘텐츠를 CSV로 빼낸다 (엑셀에서 고치기 위한 파일).

  python3 scripts/insta-export.py                    # scripts/insta-contents.csv 로 저장
  python3 scripts/insta-export.py /tmp/insta.csv     # 위치 지정

고친 뒤에는 insta-import-csv.py 로 되돌려 넣는다.
id 칸은 건드리지 말 것 — 어느 줄을 고칠지 알아내는 열쇠다.
"""

import csv
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from insta_db import connect, ENCODING, FIELDS  # noqa: E402

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "insta-contents.csv"
)

conn = connect()
rows = conn.execute(
    "SELECT id, title, body, insta_url, media_id FROM insta_contents ORDER BY id"
).fetchall()
conn.close()

with open(out, "w", encoding=ENCODING, newline="") as f:
    w = csv.DictWriter(f, fieldnames=FIELDS)
    w.writeheader()
    for r in rows:
        w.writerow({k: ("" if r[k] is None else r[k]) for k in FIELDS})

print(f"{len(rows)}건을 내보냈습니다 → {out}")
print("엑셀에서 고친 뒤:  python3 scripts/insta-import-csv.py " + out)
