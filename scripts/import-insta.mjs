#!/usr/bin/env node
/**
 * 인스타 홍보콘텐츠 일괄 등록 (scripts/insta-contents.json → insta_contents 테이블)
 *
 * 사용법 (앱 폴더에서):
 *   node scripts/import-insta.mjs            # 등록
 *   node scripts/import-insta.mjs --dry-run  # 무엇이 등록될지만 출력
 *   node scripts/import-insta.mjs --account @mangnam_people   # 인스타 계정 설정까지
 *
 * 같은 제목이 이미 있으면 건너뛴다(여러 번 돌려도 중복 생성되지 않음).
 * 관리자가 사이트에서 고친 내용은 덮어쓰지 않는다.
 * 사진은 붙이지 않는다 — 관리자 화면에서 항목별로 연결하면 된다.
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(root, "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const accountIdx = args.indexOf("--account");
const account = accountIdx >= 0 ? args[accountIdx + 1] : null;

const data = JSON.parse(fs.readFileSync(path.join(here, "insta-contents.json"), "utf8"));
const items = data.items || [];
if (!items.length) {
  console.error("등록할 콘텐츠가 없습니다.");
  process.exit(1);
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`DB를 찾지 못했습니다: ${DB_PATH}`);
  console.error("앱을 한 번 실행해 DB가 만들어진 뒤에 다시 돌려 주세요(DATA_DIR 환경변수 확인).");
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const exists = db.prepare("SELECT id FROM insta_contents WHERE title = ?");
const insert = db.prepare("INSERT INTO insta_contents (title, body) VALUES (?, ?)");

let added = 0;
let skipped = 0;
const run = db.transaction(() => {
  for (const it of items) {
    const title = String(it.title || "").trim();
    if (!title) continue;
    if (exists.get(title)) {
      skipped++;
      continue;
    }
    if (!dryRun) insert.run(title, it.body || null);
    added++;
    console.log(`  + [${it.type}/${it.category}] ${title}`);
  }
});
run();

if (account && !dryRun) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('insta_account', ?) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(String(account).trim());
  console.log(`\n인스타 계정 설정: ${account}`);
}

const total = db.prepare("SELECT COUNT(*) AS n FROM insta_contents").get().n;
console.log(
  `\n${dryRun ? "[미리보기] " : ""}등록 ${added}건 · 이미 있어 건너뜀 ${skipped}건 · 현재 총 ${total}건`
);
db.close();
