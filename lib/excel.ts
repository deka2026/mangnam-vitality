import * as XLSX from "xlsx";

/** 셀 값을 문자열로 정규화 */
function s(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

/** "1,234,000원" 같은 금액을 정수(원)로 */
function toAmount(v: unknown): number {
  if (typeof v === "number") return Math.round(v);
  const n = Number(s(v).replace(/[,원\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function toYear(v: unknown): number | null {
  const m = s(v).match(/(20\d{2})/);
  if (m) return Number(m[1]);
  const n = Number(v);
  if (n >= 2000 && n <= 2100) return n;
  return null;
}

/** 헤더 행에서 별칭에 해당하는 열 인덱스 찾기 */
function findCol(header: string[], aliases: string[]): number {
  return header.findIndex((h) => aliases.some((a) => h.replace(/\s/g, "").includes(a)));
}

export interface BudgetRow {
  year: number;
  project: string;
  category: string;
  item: string;
  planned: number;
  spent: number;
}

/** 예산집행 엑셀 파싱 — 헤더 별칭 매칭 방식으로 다양한 양식을 수용 */
export function parseBudgetExcel(buf: Buffer, defaultYear?: number): BudgetRow[] {
  const wb = XLSX.read(buf, { type: "buffer" });
  const rows: BudgetRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
      header: 1,
      defval: "",
    });
    // 헤더 행 탐색 (상위 10행 안에서 '예산'/'집행' 계열 열이 있는 행)
    let headerIdx = -1;
    let header: string[] = [];
    for (let i = 0; i < Math.min(grid.length, 10); i++) {
      const h = (grid[i] as unknown[]).map(s);
      const hasAmount =
        findCol(h, ["예산", "계획액", "배정"]) >= 0 || findCol(h, ["집행", "지출"]) >= 0;
      if (hasAmount) {
        headerIdx = i;
        header = h;
        break;
      }
    }
    if (headerIdx < 0) continue;

    const cYear = findCol(header, ["연도", "년도", "연차"]);
    const cProject = findCol(header, ["사업명", "사업구분", "사업"]);
    const cCategory = findCol(header, ["품목", "비목", "항목", "구분"]);
    const cItem = findCol(header, ["세부내용", "내용", "적요", "산출"]);
    const cPlanned = findCol(header, ["예산액", "예산", "계획액", "배정액"]);
    const cSpent = findCol(header, ["집행액", "집행금액", "집행", "지출액", "지출"]);

    // 시트명에서 연도 추출 (예: "2025년 집행")
    const sheetYear = toYear(sheetName);

    for (let i = headerIdx + 1; i < grid.length; i++) {
      const row = grid[i] as unknown[];
      const planned = cPlanned >= 0 ? toAmount(row[cPlanned]) : 0;
      const spent = cSpent >= 0 ? toAmount(row[cSpent]) : 0;
      const project = cProject >= 0 ? s(row[cProject]) : "";
      const category = cCategory >= 0 ? s(row[cCategory]) : "";
      const item = cItem >= 0 ? s(row[cItem]) : "";
      if (!planned && !spent && !project && !category && !item) continue;
      // 합계 행 제외 — 어느 열에든 합계/총계/소계가 단독으로 적혀 있으면 스킵
      const isTotalRow = row.some((cell) =>
        /^(합계|총계|소계|계)$/.test(s(cell).replace(/\s/g, ""))
      );
      if (isTotalRow) continue;

      const year =
        (cYear >= 0 ? toYear(row[cYear]) : null) ??
        sheetYear ??
        defaultYear ??
        new Date().getFullYear();

      rows.push({
        year,
        project: project || "미분류",
        category: category || "미분류",
        item,
        planned,
        spent,
      });
    }
  }
  return rows;
}

export interface ResidentRow {
  name: string;
  phone: string;
  village: string;
  role: string;
  note: string;
}

export interface RelationRow {
  a: string;
  b: string;
  relation: string;
}

/** 주민 명단 + (있다면) 관계 시트 파싱 */
export function parseResidentsExcel(buf: Buffer): {
  residents: ResidentRow[];
  relations: RelationRow[];
} {
  const wb = XLSX.read(buf, { type: "buffer" });
  const residents: ResidentRow[] = [];
  const relations: RelationRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
      header: 1,
      defval: "",
    });
    if (!grid.length) continue;

    // 헤더 행 탐색
    let headerIdx = -1;
    let header: string[] = [];
    for (let i = 0; i < Math.min(grid.length, 10); i++) {
      const h = (grid[i] as unknown[]).map(s);
      if (findCol(h, ["이름", "성명"]) >= 0) {
        headerIdx = i;
        header = h;
        break;
      }
    }
    if (headerIdx < 0) continue;

    const cRelA = findCol(header, ["이름1", "주민1", "대상1"]);
    const cRelB = findCol(header, ["이름2", "주민2", "대상2"]);
    const cRel = findCol(header, ["관계유형", "관계"]);

    if (cRelA >= 0 && cRelB >= 0) {
      // 관계 시트
      for (let i = headerIdx + 1; i < grid.length; i++) {
        const row = grid[i] as unknown[];
        const a = s(row[cRelA]);
        const b = s(row[cRelB]);
        if (!a || !b) continue;
        relations.push({ a, b, relation: cRel >= 0 ? s(row[cRel]) || "관계" : "관계" });
      }
      continue;
    }

    const cName = findCol(header, ["이름", "성명"]);
    const cPhone = findCol(header, ["전화번호", "휴대폰", "연락처", "전화"]);
    const cVillage = findCol(header, ["마을", "거주지", "주소", "리"]);
    const cRole = findCol(header, ["역할", "직책", "직위"]);
    const cNote = findCol(header, ["비고", "메모", "특이사항"]);
    const cRelTo = findCol(header, ["관계대상", "관계자"]);
    const cRelType = findCol(header, ["관계유형", "관계"]);

    for (let i = headerIdx + 1; i < grid.length; i++) {
      const row = grid[i] as unknown[];
      const name = cName >= 0 ? s(row[cName]) : "";
      if (!name) continue;
      residents.push({
        name,
        phone: cPhone >= 0 ? s(row[cPhone]) : "",
        village: cVillage >= 0 ? s(row[cVillage]) : "",
        role: cRole >= 0 ? s(row[cRole]) : "",
        note: cNote >= 0 ? s(row[cNote]) : "",
      });
      // 명단 시트 안에 관계 열이 함께 있는 경우 (관계대상 + 관계유형)
      if (cRelTo >= 0) {
        const target = s(row[cRelTo]);
        if (target) {
          relations.push({
            a: name,
            b: target,
            relation: cRelType >= 0 ? s(row[cRelType]) || "관계" : "관계",
          });
        }
      }
    }
  }
  return { residents, relations };
}
