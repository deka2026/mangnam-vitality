import { zipSync, strToU8 } from "fflate";
import { HEADER_XML } from "./hwpx-assets";

/**
 * 마크다운 문서를 한글(HWPX) 파일로 변환한다.
 *
 * HWPX = 한컴 오피스 한글의 개방형 포맷(OWPML, KS X 6101) — zip 안에 XML.
 * 실제 한글 문서에서 추출한 header.xml(스타일 정의)을 템플릿으로 쓰고
 * 본문 section0.xml 만 생성한다. 스타일 ID 의미는 lib/hwpx-assets.ts 참고.
 *
 * 지원 마크다운: # ~ #### 제목, 문단, - / * / 1. 목록, GFM 표, **굵게**.
 */

// ---------- 마크다운 파싱 ----------

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "para"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const isTableLine = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const splitRow = (l: string) =>
    l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(3, Math.max(1, h[1].length - 1)) as 1 | 2 | 3; // #·## → 1
      blocks.push({ kind: "heading", level, text: h[2].trim() });
      i++;
      continue;
    }

    if (isTableLine(trimmed) && i + 1 < lines.length && /^\s*\|[\s\-:|]+\|\s*$/.test(lines[i + 1])) {
      const header = splitRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    const li = trimmed.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    if (li) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(/^([-*•]|\d+[.)])\s+(.*)$/);
        if (!m) break;
        const numbered = /^\d/.test(m[1]);
        items.push(numbered ? `${m[1]} ${m[2]}` : m[2]);
        i++;
      }
      blocks.push({ kind: "list", items });
      continue;
    }

    // 연속된 일반 줄은 한 문단으로
    const buf: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || /^#{1,6}\s/.test(t) || isTableLine(t) || /^([-*•]|\d+[.)])\s/.test(t)) break;
      buf.push(t);
      i++;
    }
    blocks.push({ kind: "para", text: buf.join(" ") });
  }
  return blocks;
}

// ---------- XML 생성 ----------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 인라인 마크다운(**굵게**, 링크, 코드)을 hp:run 목록으로 변환 */
function runs(text: string, baseCharPr: number, boldCharPr: number): string {
  const cleaned = text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // 링크 → 텍스트만
    .replace(/`([^`]+)`/g, "$1");
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  if (!parts.length) return `<hp:run charPrIDRef="${baseCharPr}"><hp:t></hp:t></hp:run>`;
  return parts
    .map((p) => {
      const bold = p.startsWith("**") && p.endsWith("**");
      const t = bold ? p.slice(2, -2) : p;
      return `<hp:run charPrIDRef="${bold ? boldCharPr : baseCharPr}"><hp:t>${esc(
        t.replace(/\*/g, "")
      )}</hp:t></hp:run>`;
    })
    .join("");
}

let pidCounter = 0;
function para(paraPr: number, content: string): string {
  pidCounter++;
  return `<hp:p id="${pidCounter}" paraPrIDRef="${paraPr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">${content}</hp:p>`;
}

// A4 세로, 여백 20mm 기준 본문 폭 (hwpunit = 1/7200 inch)
const BODY_WIDTH = 59528 - 5669 * 2;

function tableXml(header: string[], rows: string[][], tblId: number): string {
  const cols = Math.max(header.length, ...rows.map((r) => r.length), 1);
  const colW = Math.floor(BODY_WIDTH / cols);
  const rowH = 1600;
  const allRows = [header, ...rows];

  const trXml = allRows
    .map((row, ri) => {
      const isHead = ri === 0;
      const tcXml = Array.from({ length: cols }, (_, ci) => {
        const cell = row[ci] ?? "";
        const p = para(
          isHead ? 104 : 105,
          runs(cell, isHead ? 106 : 100, isHead ? 106 : 105)
        );
        return (
          `<hp:tc name="" header="${isHead ? 1 : 0}" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="${isHead ? 12 : 8}">` +
          `<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${p}</hp:subList>` +
          `<hp:cellAddr colAddr="${ci}" rowAddr="${ri}"/><hp:cellSpan colSpan="1" rowSpan="1"/>` +
          `<hp:cellSz width="${colW}" height="${rowH}"/><hp:cellMargin left="141" right="141" top="141" bottom="141"/></hp:tc>`
        );
      }).join("");
      return `<hp:tr>${tcXml}</hp:tr>`;
    })
    .join("");

  return (
    `<hp:tbl id="${tblId}" zOrder="${tblId}" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="${allRows.length}" colCnt="${cols}" cellSpacing="0" borderFillIDRef="4" noAdjust="0">` +
    `<hp:sz width="${colW * cols}" widthRelTo="ABSOLUTE" height="${rowH * allRows.length}" heightRelTo="ABSOLUTE" protect="0"/>` +
    `<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>` +
    `<hp:outMargin left="0" right="0" top="141" bottom="141"/><hp:inMargin left="283" right="283" top="141" bottom="141"/>${trXml}</hp:tbl>`
  );
}

const SEC_PR =
  '<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0">' +
  '<hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/>' +
  '<hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/>' +
  '<hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/>' +
  '<hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/>' +
  '<hp:pagePr landscape="NARROWLY" width="59528" height="84186" gutterType="LEFT_ONLY">' +
  '<hp:margin header="2834" footer="2834" gutter="0" left="5669" right="5669" top="4252" bottom="4252"/></hp:pagePr>' +
  '<hp:footNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="EACH_COLUMN" beneathText="0"/></hp:footNotePr>' +
  '<hp:endNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="END_OF_DOCUMENT" beneathText="0"/></hp:endNotePr>' +
  '<hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>' +
  '<hp:pageBorderFill type="EVEN" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>' +
  '<hp:pageBorderFill type="ODD" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>' +
  "</hp:secPr><hp:ctrl><hp:colPr id=\"\" type=\"NEWSPAPER\" layout=\"LEFT\" colCount=\"1\" sameSz=\"1\" sameGap=\"0\"/></hp:ctrl>";

const SECTION_NS =
  'xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"';

function buildSection(title: string, subtitle: string, blocks: Block[]): string {
  pidCounter = 100;
  let tblId = 1000000;
  const paras: string[] = [];

  // 첫 문단: 섹션 설정 + 문서 제목
  paras.push(
    para(100, `<hp:run charPrIDRef="101">${SEC_PR}<hp:t>${esc(title)}</hp:t></hp:run>`)
  );
  if (subtitle) {
    paras.push(para(100, `<hp:run charPrIDRef="107"><hp:t>${esc(subtitle)}</hp:t></hp:run>`));
  }

  for (const b of blocks) {
    switch (b.kind) {
      case "heading": {
        const charPr = b.level === 1 ? 102 : b.level === 2 ? 103 : 104;
        paras.push(para(101, `<hp:run charPrIDRef="${charPr}"><hp:t>${esc(b.text)}</hp:t></hp:run>`));
        break;
      }
      case "para":
        paras.push(para(102, runs(b.text, 100, 105)));
        break;
      case "list":
        for (const item of b.items) {
          const bullet = /^\d/.test(item) ? "" : "• ";
          paras.push(
            para(103, `<hp:run charPrIDRef="100"><hp:t>${esc(bullet)}</hp:t></hp:run>` + runs(item, 100, 105))
          );
        }
        break;
      case "table":
        tblId++;
        paras.push(para(102, `<hp:run charPrIDRef="100">${tableXml(b.header, b.rows, tblId)}</hp:run>`));
        break;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><hs:sec ${SECTION_NS}>${paras.join("")}</hs:sec>`;
}

// ---------- 패키지 파일들 ----------

const VERSION_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><hv:HCFVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" tagetApplication="WORDPROCESSOR" major="5" minor="1" micro="0" buildNumber="1" os="1" xmlVersion="1.4" application="mangnam-vitality docgen" appVersion="1.0"/>';

const CONTAINER_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf"><ocf:rootfiles><ocf:rootfile full-path="Contents/content.hpf" media-type="application/hwpml-package+xml"/><ocf:rootfile full-path="Preview/PrvText.txt" media-type="text/plain"/><ocf:rootfile full-path="META-INF/container.rdf" media-type="application/rdf+xml"/></ocf:rootfiles></ocf:container>';

const MANIFEST_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><odf:manifest xmlns:odf="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"/>';

const CONTAINER_RDF =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://www.hancom.co.kr/hwpml/2016/meta/pkg#" rdf:resource="Contents/header.xml"/></rdf:Description><rdf:Description rdf:about="Contents/header.xml"><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#HeaderFile"/></rdf:Description><rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://www.hancom.co.kr/hwpml/2016/meta/pkg#" rdf:resource="Contents/section0.xml"/></rdf:Description><rdf:Description rdf:about="Contents/section0.xml"><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#SectionFile"/></rdf:Description><rdf:Description rdf:about=""><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#Document"/></rdf:Description></rdf:RDF>';

const SETTINGS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><ha:HWPApplicationSetting xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"><ha:CaretPosition listIDRef="0" paraIDRef="0" pos="0"/></ha:HWPApplicationSetting>';

function contentHpf(title: string, isoDate: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>' +
    '<opf:package xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:dc="http://purl.org/dc/elements/1.1/" version="" unique-identifier="" id="">' +
    `<opf:metadata><opf:title>${esc(title)}</opf:title><opf:language>ko</opf:language>` +
    '<opf:meta name="creator" content="text">망남생활권 어촌신활력증진사업</opf:meta>' +
    `<opf:meta name="CreatedDate" content="text">${isoDate}</opf:meta>` +
    `<opf:meta name="ModifiedDate" content="text">${isoDate}</opf:meta></opf:metadata>` +
    '<opf:manifest><opf:item id="header" href="Contents/header.xml" media-type="application/xml"/>' +
    '<opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/>' +
    '<opf:item id="settings" href="settings.xml" media-type="application/xml"/></opf:manifest>' +
    '<opf:spine><opf:itemref idref="header"/><opf:itemref idref="section0" linear="yes"/></opf:spine></opf:package>'
  );
}

// ---------- 공개 API ----------

export interface HwpxInput {
  title: string;
  subtitle?: string; // 제목 아래 작은 글씨 (예: 날짜·작성 주체)
  markdown: string; // 본문
}

/** 마크다운 문서를 HWPX(zip) 버퍼로 변환 */
export function buildHwpx(input: HwpxInput): Buffer {
  const blocks = parseMarkdown(input.markdown);
  const section = buildSection(input.title, input.subtitle ?? "", blocks);
  const preview = (input.title + "\n\n" + input.markdown.replace(/[#*|`]/g, "")).slice(0, 2000);

  const files: Record<string, [Uint8Array, { level: 0 | 6 }]> = {
    mimetype: [strToU8("application/hwp+zip"), { level: 0 }],
    "version.xml": [strToU8(VERSION_XML), { level: 6 }],
    "META-INF/container.xml": [strToU8(CONTAINER_XML), { level: 6 }],
    "META-INF/manifest.xml": [strToU8(MANIFEST_XML), { level: 6 }],
    "META-INF/container.rdf": [strToU8(CONTAINER_RDF), { level: 6 }],
    "Contents/content.hpf": [strToU8(contentHpf(input.title, new Date().toISOString().slice(0, 19) + "Z")), { level: 6 }],
    "Contents/header.xml": [strToU8(HEADER_XML), { level: 6 }],
    "Contents/section0.xml": [strToU8(section), { level: 6 }],
    "settings.xml": [strToU8(SETTINGS_XML), { level: 6 }],
    "Preview/PrvText.txt": [strToU8(preview), { level: 6 }],
  };
  return Buffer.from(zipSync(files));
}
