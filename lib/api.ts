import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

/** 관리자 권한 확인. 미인증이면 401 응답 반환, 인증됐으면 null */
export function requireAdmin(): NextResponse | null {
  if (!isAdmin()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}
