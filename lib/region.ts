// 사업지(지역) 축 — 2026-10-13 통합 개편 4-2. 어촌신활력증진사업: 망남(완도)·양양(강원).
export const REGIONS = ["망남", "양양"] as const;
export type Region = (typeof REGIONS)[number];
export const REGION_DEFAULT: Region = "망남";
export const REGION_LABEL: Record<Region, string> = {
  망남: "망남 (완도 망남생활권)",
  양양: "양양 (강원 양양)",
};
export function normRegion(v: unknown): Region {
  const s = String(v ?? "").trim();
  return (REGIONS as readonly string[]).includes(s) ? (s as Region) : REGION_DEFAULT;
}
