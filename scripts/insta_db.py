"""인스타 콘텐츠 CSV 도구 공용 부분 (DB 위치 찾기).

node/better-sqlite3를 거치지 않고 파이썬 표준 라이브러리만 쓴다.
서버 셸의 node 버전이 node_modules 빌드 시점과 달라도 영향받지 않는다.
"""

import os
import re
import sqlite3

APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = "/etc/mangnam-vitality.env"


def data_dir() -> str:
    """DATA_DIR: 환경변수 > /etc/mangnam-vitality.env > 앱폴더/data"""
    d = os.environ.get("DATA_DIR")
    if not d and os.path.exists(ENV_FILE):
        with open(ENV_FILE, encoding="utf-8", errors="replace") as f:
            for line in f:
                m = re.match(r"\s*DATA_DIR\s*=\s*(.+?)\s*$", line)
                if m:
                    d = m.group(1).strip().strip("\"'")
    return d or os.path.join(APP_ROOT, "data")


def connect() -> sqlite3.Connection:
    path = os.path.join(data_dir(), "app.db")
    if not os.path.exists(path):
        raise SystemExit(
            f"DB를 찾지 못했습니다: {path}\n"
            "DATA_DIR 를 확인하거나 DATA_DIR=/경로 python3 ... 로 지정해 주세요."
        )
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


# 엑셀이 한글을 깨뜨리지 않도록 BOM 포함 UTF-8을 쓴다.
ENCODING = "utf-8-sig"
FIELDS = ["id", "title", "body", "insta_url", "media_id"]
