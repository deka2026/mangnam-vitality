"use client";

import { useEffect, useMemo, useState } from "react";

export interface GraphNode {
  id: number;
  name: string;
  village: string | null;
  role: string | null;
}
export interface GraphEdge {
  a_id: number;
  b_id: number;
  relation: string;
}

interface Pos {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const W = 900;
const H = 620;

const VILLAGE_COLORS = [
  "#2f8290",
  "#a97a41",
  "#4d9daa",
  "#c19558",
  "#1f5361",
  "#d4b585",
  "#7fbcc7",
];

/** 외부 의존성 없는 간단한 force-directed 배치 */
function layout(nodes: GraphNode[], edges: GraphEdge[]): Map<number, Pos> {
  const pos = new Map<number, Pos>();
  const n = nodes.length;
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1);
    const r = Math.min(W, H) * 0.35;
    pos.set(node.id, {
      x: W / 2 + r * Math.cos(angle),
      y: H / 2 + r * Math.sin(angle),
      vx: 0,
      vy: 0,
    });
  });

  const iterations = 250;
  for (let it = 0; it < iterations; it++) {
    // 반발력
    for (const a of nodes) {
      const pa = pos.get(a.id)!;
      for (const b of nodes) {
        if (a.id >= b.id) continue;
        const pb = pos.get(b.id)!;
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        const dist2 = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(dist2);
        const force = 2500 / dist2;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        pa.vx += dx;
        pa.vy += dy;
        pb.vx -= dx;
        pb.vy -= dy;
      }
    }
    // 인력 (간선)
    for (const e of edges) {
      const pa = pos.get(e.a_id);
      const pb = pos.get(e.b_id);
      if (!pa || !pb) continue;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 90) * 0.02;
      pa.vx += (dx / dist) * force;
      pa.vy += (dy / dist) * force;
      pb.vx -= (dx / dist) * force;
      pb.vy -= (dy / dist) * force;
    }
    // 중심으로 약한 인력 + 이동
    for (const node of nodes) {
      const p = pos.get(node.id)!;
      p.vx += (W / 2 - p.x) * 0.002;
      p.vy += (H / 2 - p.y) * 0.002;
      p.x += Math.max(-8, Math.min(8, p.vx));
      p.y += Math.max(-8, Math.min(8, p.vy));
      p.vx *= 0.55;
      p.vy *= 0.55;
      p.x = Math.max(30, Math.min(W - 30, p.x));
      p.y = Math.max(30, Math.min(H - 30, p.y));
    }
  }
  return pos;
}

export default function RelationGraph({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [positions, setPositions] = useState<Map<number, Pos> | null>(null);

  useEffect(() => {
    setPositions(layout(nodes, edges));
  }, [nodes, edges]);

  const villages = useMemo(() => {
    const vs = Array.from(new Set(nodes.map((n) => n.village || "미지정")));
    return new Map(vs.map((v, i) => [v, VILLAGE_COLORS[i % VILLAGE_COLORS.length]]));
  }, [nodes]);

  if (!positions) return <p className="text-sm text-sea-600">관계도 계산 중...</p>;

  const neighborIds = new Set<number>();
  if (selected !== null) {
    for (const e of edges) {
      if (e.a_id === selected) neighborIds.add(e.b_id);
      if (e.b_id === selected) neighborIds.add(e.a_id);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 text-xs text-sea-700">
        {Array.from(villages.entries()).map(([v, c]) => (
          <span key={v} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: c }} />
            {v}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full rounded-xl bg-white ring-1 ring-sea-100"
        onClick={() => setSelected(null)}
      >
        {edges.map((e, i) => {
          const pa = positions.get(e.a_id);
          const pb = positions.get(e.b_id);
          if (!pa || !pb) return null;
          const active = selected === null || e.a_id === selected || e.b_id === selected;
          return (
            <g key={i} opacity={active ? 1 : 0.12}>
              <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#b3d9e0" strokeWidth={1.5} />
              <text
                x={(pa.x + pb.x) / 2}
                y={(pa.y + pb.y) / 2 - 3}
                fontSize={9}
                fill="#4d9daa"
                textAnchor="middle"
              >
                {e.relation}
              </text>
            </g>
          );
        })}
        {nodes.map((n) => {
          const p = positions.get(n.id)!;
          const dim = selected !== null && selected !== n.id && !neighborIds.has(n.id);
          return (
            <g
              key={n.id}
              opacity={dim ? 0.2 : 1}
              onClick={(ev) => {
                ev.stopPropagation();
                setSelected(selected === n.id ? null : n.id);
              }}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={selected === n.id ? 14 : 10}
                fill={villages.get(n.village || "미지정")}
                stroke={selected === n.id ? "#1c434f" : "white"}
                strokeWidth={2}
              />
              <text x={p.x} y={p.y + 24} fontSize={11} fontWeight={600} fill="#1c434f" textAnchor="middle">
                {n.name}
              </text>
              {n.role && (
                <text x={p.x} y={p.y + 36} fontSize={9} fill="#4d9daa" textAnchor="middle">
                  {n.role}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-xs text-sea-500">
        점을 클릭하면 그 주민과 연결된 관계만 강조됩니다. 색상은 마을(거주지) 구분입니다.
      </p>
    </div>
  );
}
