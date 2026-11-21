import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, cookieSecure } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: cookieSecure(req) });
  return res;
}
