import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { parseResidentsExcel } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  const d = db();
  return NextResponse.json({
    residents: d.prepare("SELECT * FROM residents ORDER BY name").all(),
    relations: d.prepare("SELECT * FROM resident_relations").all(),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "엑셀 파일을 선택해 주세요." }, { status: 400 });

  let parsed;
  try {
    parsed = parseResidentsExcel(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "엑셀 파일을 읽을 수 없습니다." }, { status: 400 });
  }
  if (!parsed.residents.length) {
    return NextResponse.json(
      { error: "인식 가능한 주민 데이터가 없습니다. 헤더에 '이름'(또는 '성명') 열이 필요합니다." },
      { status: 400 }
    );
  }

  const d = db();
  const replace = form?.get("replace") === "true";
  d.transaction(() => {
    if (replace) {
      d.prepare("DELETE FROM resident_relations").run();
      d.prepare("DELETE FROM residents").run();
    }
    const insertR = d.prepare(
      "INSERT INTO residents (name, phone, village, role, note) VALUES (?,?,?,?,?)"
    );
    for (const r of parsed.residents) {
      insertR.run(r.name, r.phone || null, r.village || null, r.role || null, r.note || null);
    }
    // 이름 → id 매핑 후 관계 저장 (동명이인은 첫 번째 매칭)
    const idByName = new Map<string, number>();
    for (const row of d.prepare("SELECT id, name FROM residents").all() as {
      id: number;
      name: string;
    }[]) {
      if (!idByName.has(row.name)) idByName.set(row.name, row.id);
    }
    const insertRel = d.prepare(
      "INSERT INTO resident_relations (a_id, b_id, relation) VALUES (?,?,?)"
    );
    for (const rel of parsed.relations) {
      const a = idByName.get(rel.a);
      const b = idByName.get(rel.b);
      if (a && b && a !== b) insertRel.run(a, b, rel.relation);
    }
  })();

  return NextResponse.json({
    ok: true,
    residents: parsed.residents.length,
    relations: parsed.relations.length,
  });
}

export async function DELETE() {
  const denied = requireAdmin();
  if (denied) return denied;
  const d = db();
  d.prepare("DELETE FROM resident_relations").run();
  d.prepare("DELETE FROM residents").run();
  return NextResponse.json({ ok: true });
}
