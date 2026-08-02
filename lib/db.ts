import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { seedIfEmpty } from "./seed";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  _db = new Database(path.join(DATA_DIR, "app.db"));
  _db.pragma("journal_mode = WAL");
  migrate(_db);
  seedIfEmpty(_db);
  return _db;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL DEFAULT '방문',           -- 방문 | 사업 | 기타
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      message TEXT NOT NULL,
      answer TEXT,
      answered_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,                        -- markdown
      cover_media_id INTEGER,
      source_report TEXT,                           -- 원본 보고서 파일명
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS kpis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      unit TEXT,
      note TEXT,
      sort INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,                           -- image | video
      filename TEXT NOT NULL,                       -- 저장 파일명 (uploads/ 하위)
      original_name TEXT,
      caption TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS insta_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,                                    -- 캡션/본문
      media_id INTEGER,
      insta_url TEXT,                               -- 실제 인스타 게시물 링크
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      project TEXT NOT NULL DEFAULT '미분류',        -- 사업명
      category TEXT NOT NULL DEFAULT '미분류',       -- 품목/항목
      item TEXT,                                    -- 세부 내용
      planned INTEGER NOT NULL DEFAULT 0,           -- 예산액(원)
      spent INTEGER NOT NULL DEFAULT 0,             -- 집행액(원)
      source_file TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      village TEXT,
      role TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS resident_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      a_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
      b_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
      relation TEXT NOT NULL                        -- 가족, 이웃, 조합원 등
    );

    CREATE TABLE IF NOT EXISTS sms_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipients TEXT NOT NULL,                     -- JSON [{name, phone}]
      message TEXT NOT NULL,
      status TEXT NOT NULL,                         -- sent | simulated | failed
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export function getSetting(key: string): string | null {
  const row = db().prepare("SELECT value FROM settings WHERE key=?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  db()
    .prepare(
      "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
    )
    .run(key, value);
}
