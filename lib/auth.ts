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

export function isAdmin(): boolean {
  return verifyToken(cookies().get(COOKIE_NAME)?.value);
}
