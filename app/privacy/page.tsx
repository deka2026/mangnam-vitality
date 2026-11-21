import type { Metadata } from "next";
import { PRIVACY_HTML } from "@/lib/privacy-html";

export const metadata: Metadata = {
  title: "개인정보 처리방침 · 망남생활권 어촌신활력증진사업",
};

// 처리방침 초안(망남_처리방침_초안_20261121.html)의 꾸밈을 이 화면 안에만 적용
const STYLE = `
.pp{max-width:760px;margin:0 auto;padding:40px 16px 80px;color:#1C2621;line-height:1.7}
.pp h1{font-size:24px;font-weight:700;color:#0D3B2C}
.pp h2{font-size:17px;font-weight:700;margin-top:32px;color:#2C5842}
.pp h3{font-size:15px;font-weight:700;margin:20px 0 6px;color:#2C5842}
.pp p{margin:8px 0}.pp ul{list-style:disc;padding-left:22px;margin:8px 0}
.pp table{border-collapse:collapse;width:100%;font-size:14px}
.pp th,.pp td{border:1px solid #D9D2C0;padding:8px 10px;text-align:left;vertical-align:top}
.pp th{background:#EDF2E5}
.pp .tw{overflow-x:auto;margin:8px 0}
.pp p,.pp li{font-size:15px}.pp .small{font-size:13px;color:#4F5A50}
.pp a{color:#2C5842;text-decoration:underline}
`;

export default function PrivacyPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <article className="pp" dangerouslySetInnerHTML={{ __html: PRIVACY_HTML }} />
    </>
  );
}
