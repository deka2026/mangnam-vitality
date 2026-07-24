import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { parseBudgetExcel } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  const d = db();
  const byYear = d
    .prepare(
      "SELECT year, SUM(planned) planned, SUM(spent) spent FROM budget_items GROUP BY year ORDER BY year"
    )
    .all();
  const byProject = d
    .prepare(
      "SELECT year, project, SUM(planned) planned, SUM(spent) spent FROM budget_items GROUP BY year, project ORDER BY year, planned DESC"
    )
    .all();
  const byCategory = d
    .prepare(
      "SELECT year, category, SUM(planned) planned, SUM(spent) spent FROM budget_items GROUP BY year, category ORDER BY year, planned DESC"
    )
    .all();
  const items = d
    .prepare("SELECT * FROM budget_items ORDER BY year DESC, project, category LIMIT 1000")
    .all();
  return NextResponse.json({ byYear, byProject, byCategory, items });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "엑셀 파일을 선택해 주세요." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  let rows;
  try {
    rows = parseBudgetExcel(buf);
  } catch {
    return NextResponse.json({ error: "엑셀 파일을 읽을 수 없습니다." }, { status: 400 });
  }
  if (!rows.length) {
    return NextResponse.json(
      {
        error:
          "인식 가능한 데이터가 없습니다. 헤더에 '예산(액)'과 '집행(액)' 열이 있는지 확인해 주세요. 권장 열: 연도, 사업명, 품목, 내용, 예산액, 집행액",
      },
      { status: 400 }
    );
  }

  const d = db();
  const replace = form?.get("replace") === "true";
  const insert = d.prepare(
    "INSERT INTO budget_items (year, project, category, item, planned, spent, source_file) VALUES (?,?,?,?,?,?,?)"
  );
  d.transaction(() => {
    if (replace) d.prepare("DELETE FROM budget_items").run();
    for (const r of rows) {
      insert.run(r.year, r.project, r.category, r.item, r.planned, r.spent, file.name);
    }
  })();

  return NextResponse.json({ ok: true, count: rows.length });
}

export async function DELETE() {
  const denied = requireAdmin();
  if (denied) return denied;
  db().prepare("DELETE FROM budget_items").run();
  return NextResponse.json({ ok: true });
}
