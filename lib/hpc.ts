import { spawn } from "child_process";
import fs from "fs";

/**
 * 사교원 HPC 길잡이(/opt/sakyowon/hpc_route.py 의 연산())를 부른다 — 2026-11-21 이사장 결정.
 * Anthropic 등 외부 AI 로 직접 보내지 않는다. 엔진이 못 하면 실패로 돌려준다(폴백 없음).
 * 개인정보는 hpc_cli 가 「(생략)」으로 가린 뒤 보내고, 그래도 남으면 거절(refused)한다.
 */

const PYTHON = process.env.HPC_PYTHON || "/opt/sakyowon/.venv/bin/python";
const CLI = process.env.HPC_CLI || "/opt/sakyowon/tools/hpc_cli.py";

export interface HpcRequest {
  지시: string;
  입력: string;
  용도: string;
  최대글자?: number;
  가리기?: boolean;
  확인?: "json" | "제목본문";
}

export interface HpcResult {
  ok: boolean;
  answer?: string;
  data?: unknown;
  masked?: string[];
  error?: string;
  refused?: boolean;
  busy?: boolean;
}

export function hpcAvailable(): boolean {
  return fs.existsSync(CLI) && fs.existsSync(PYTHON);
}

export function callHpc(req: HpcRequest): Promise<HpcResult> {
  return new Promise((resolve) => {
    const child = spawn(PYTHON, ["-I", CLI], {
      stdio: ["pipe", "pipe", "pipe"],
      // 외부 AI 키 등 앱 환경변수를 넘기지 않는다
      env: { PATH: "/usr/bin:/bin", HOME: process.env.HOME || "/tmp", HPC_TEST: process.env.HPC_TEST || "" } as unknown as NodeJS.ProcessEnv,
    });
    let out = "";
    let done = false;
    const finish = (r: HpcResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    };
    // 엔진 제한초 90 + 재시도 여유
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({ ok: false, error: "AI 엔진 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요." });
    }, 200_000);
    child.stdout.on("data", (b) => (out += b.toString("utf-8")));
    child.stderr.on("data", () => {});
    child.on("error", () => finish({ ok: false, error: "AI 엔진 연결 도구를 실행하지 못했습니다." }));
    child.on("close", () => {
      try {
        finish(JSON.parse(out) as HpcResult);
      } catch {
        finish({ ok: false, error: "AI 엔진 연결 도구의 응답을 읽지 못했습니다." });
      }
    });
    child.stdin.end(JSON.stringify({ 앱: "vitality", 가리기: true, ...req }));
  });
}

/** 화면에 보여 줄 오류 — 개인정보 거절은 정해진 문구로 */
export class HpcError extends Error {
  status: number;
  constructor(r: HpcResult) {
    super(
      r.refused
        ? "개인정보가 들어 있어 AI 로 보내지 않았습니다. 이름·전화번호 등을 지우거나 「OOO」처럼 바꾼 뒤 다시 시도해 주세요."
        : r.error || "AI 생성 중 오류가 발생했습니다."
    );
    this.status = r.refused ? 422 : r.busy ? 429 : 502;
  }
}
