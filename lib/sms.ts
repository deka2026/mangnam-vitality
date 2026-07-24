// 알리고(smartsms.aligo.in) 문자 발송 어댑터.
// ALIGO_API_KEY / ALIGO_USER_ID / SMS_SENDER 환경변수가 없으면 시뮬레이션 모드로 동작한다.

export interface SmsResult {
  status: "sent" | "simulated" | "failed";
  detail: string;
}

export function smsConfigured(): boolean {
  return !!(process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID && process.env.SMS_SENDER);
}

export async function sendSms(phones: string[], message: string): Promise<SmsResult> {
  const cleaned = phones
    .map((p) => p.replace(/[^0-9]/g, ""))
    .filter((p) => p.length >= 9);
  if (!cleaned.length) {
    return { status: "failed", detail: "유효한 전화번호가 없습니다." };
  }

  if (!smsConfigured()) {
    return {
      status: "simulated",
      detail: `시뮬레이션: ${cleaned.length}명에게 발송 예정 내용이 기록되었습니다. (SMS API 키 미설정)`,
    };
  }

  const form = new URLSearchParams({
    key: process.env.ALIGO_API_KEY!,
    user_id: process.env.ALIGO_USER_ID!,
    sender: process.env.SMS_SENDER!,
    receiver: cleaned.join(","),
    msg: message,
    msg_type: new Blob([message]).size > 90 ? "LMS" : "SMS",
  });

  try {
    const res = await fetch("https://apis.aligo.in/send/", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { result_code: number | string; message: string };
    if (Number(data.result_code) === 1) {
      return { status: "sent", detail: `발송 완료 (${cleaned.length}명)` };
    }
    return { status: "failed", detail: `알리고 오류: ${data.message}` };
  } catch (err) {
    return {
      status: "failed",
      detail: `발송 요청 실패: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
