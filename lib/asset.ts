// 그림 주소 — 정적 홍보판(basePath /mangnam-vitality)에서도 같은 그림이 열리게 앞머리를 붙인다.
export const asset = (p: string) =>
  (process.env.NEXT_PUBLIC_STATIC === "1" ? "/mangnam-vitality" : "") + p;
