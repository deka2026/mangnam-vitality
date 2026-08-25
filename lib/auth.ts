import crypto from "crypto";
import { cookies } from "next/headers";

export const DEFAULT_PASSWORD = "mangnam-dev-2026";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export function usingDefaultPassword(): boolean {
  return !process.env.ADMIN_PASSWORD;
}

function secret(): string {
  return process.env.SESSION_SECRET || `mangnam-session-${adminPassword()}`;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createToken(): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7일
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(payload) > Date.now();
}

export const COOKIE_NAME = "mangnam_admin";

/* ── 사교원 통합 계정(SSO) ──
   sakyowon.co.kr 로그인 쿠키(sk_session, Domain=.sakyowon.co.kr)가
   vitality.sakyowon.co.kr 요청에도 실려 온다. 중앙 API로 검증해
   admin·staff 역할이면 이 사이트 관리자로 인정한다. */
const SSO_COOKIE = "sk_session";
const SSO_ME_URL = process.env.SSO_ME_URL || "https://sakyowon.co.kr/api/auth/me";
const ssoCache = new Map<string, { ok: boolean; exp: number }>();

async function verifySso(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const hit = ssoCache.get(token);
  if (hit && hit.exp > Date.now()) return hit.ok;
  let ok = false;
  try {
    const res = await fetch(SSO_ME_URL, {
      headers: { cookie: `${SSO_COOKIE}=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    const d = res.ok ? await res.json() : null;
    ok = !!d?.ok && (d.user?.role === "admin" || d.user?.role === "staff");
  } catch {
    ok = false;
  }
  ssoCache.set(token, { ok, exp: Date.now() + 60_000 });
  return ok;
}

export async function isAdmin(): Promise<boolean> {
  const jar = cookies();
  if (verifyToken(jar.get(COOKIE_NAME)?.value)) return true;
  return verifySso(jar.get(SSO_COOKIE)?.value);
}
