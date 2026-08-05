import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { unzipSync, strFromU8 } from "fflate";
import * as XLSX from "xlsx";

/**
 * 업로드된 참고자료 파일에서 텍스트를 뽑아낸다.
 * PDF 는 추출하지 않고 base64 로 넘겨 Claude 가 직접 읽게 한다.
 */

export interface ExtractedRef {
  name: string;
  text?: string;
  pdfBase64?: string;
}

const MAX_TEXT = 40000; // 파일 하나당 텍스트 상한

/** hwp5txt CLI (pyhwp) 로 한글 v5 바이너리에서 텍스트 추출. 없으면 null */
function hwpToText(buf: Buffer): string | null {
  const tmp = path.join(os.tmpdir(), `docgen-${process.pid}-${Math.random().toString(36).slice(2)}.hwp`);
  try {
    fs.writeFileSync(tmp, buf);
    const env = {
      ...process.env,
      PATH: `${process.env.PATH || ""}:${path.join(os.homedir(), ".local/bin")}`,
    };
    const r = spawnSync("hwp5txt", [tmp], { env, encoding: "utf-8", maxBuffer: 32 * 1024 * 1024, timeout: 60000 });
    if (r.status === 0 && r.stdout?.trim()) return r.stdout;
    return null;
  } catch {
    return null;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** hwpx(zip) 의 섹션 XML 에서 <hp:t> 텍스트만 모은다 */
function hwpxToText(buf: Buffer): string {
  const files = unzipSync(new Uint8Array(buf));
  const parts: string[] = [];
  for (const name of Object.keys(files).sort()) {
    if (/^Contents\/section\d+\.xml$/.test(name)) {
      const xml = strFromU8(files[name]);
      const texts = xml.match(/<hp:t[^>]*>([^<]*)<\/hp:t>/g) ?? [];
      parts.push(
        texts
          .map((t) => t.replace(/<[^>]+>/g, ""))
          .join(" ")
          .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
      );
    }
  }
  return parts.join("\n");
}

function docxToText(buf: Buffer): string {
  const files = unzipSync(new Uint8Array(buf));
  const xml = strFromU8(files["word/document.xml"]);
  return xml
    .replace(/<w:p [^>]*>|<w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

function xlsxToText(buf: Buffer): string {
  const wb = XLSX.read(buf, { type: "buffer" });
  return wb.SheetNames.map(
    (n) => `[시트: ${n}]\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}`
  ).join("\n\n");
}

/**
 * 파일 → 텍스트(또는 PDF base64).
 * @throws 지원하지 않는 형식이거나 추출 실패 시 사용자에게 보여줄 메시지
 */
export async function extractRef(file: File): Promise<ExtractedRef> {
  const name = file.name;
  const lower = name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (lower.endsWith(".pdf")) return { name, pdfBase64: buf.toString("base64") };
  if (/\.(txt|md|csv)$/.test(lower)) return { name, text: buf.toString("utf-8").slice(0, MAX_TEXT) };
  if (lower.endsWith(".hwpx")) {
    try {
      return { name, text: hwpxToText(buf).slice(0, MAX_TEXT) };
    } catch {
      throw new Error(`${name}: 한글(HWPX) 파일을 읽지 못했습니다.`);
    }
  }
  if (lower.endsWith(".hwp")) {
    const text = hwpToText(buf);
    if (text) return { name, text: text.slice(0, MAX_TEXT) };
    throw new Error(
      `${name}: 이 서버에서 한글(HWP) 텍스트 추출 도구를 쓸 수 없습니다. PDF로 변환해 올리거나 내용을 붙여넣어 주세요.`
    );
  }
  if (lower.endsWith(".docx")) {
    try {
      return { name, text: docxToText(buf).slice(0, MAX_TEXT) };
    } catch {
      throw new Error(`${name}: 워드(DOCX) 파일을 읽지 못했습니다.`);
    }
  }
  if (/\.xlsx?$/.test(lower)) {
    try {
      return { name, text: xlsxToText(buf).slice(0, MAX_TEXT) };
    } catch {
      throw new Error(`${name}: 엑셀 파일을 읽지 못했습니다.`);
    }
  }
  throw new Error(`${name}: 지원하지 않는 형식입니다 (PDF·HWP·HWPX·DOCX·XLSX·TXT·MD·CSV 가능).`);
}
