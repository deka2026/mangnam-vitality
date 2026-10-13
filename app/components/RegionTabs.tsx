import Link from "next/link";
import { REGIONS, REGION_LABEL, type Region } from "@/lib/region";

// 사업지(망남/양양) 전환 탭. base 는 현재 경로(예: "/news"), region 은 현재 지역.
export default function RegionTabs({ region, base }: { region: Region; base: string }) {
  return (
    <div className="inline-flex rounded-lg border border-sea-200 bg-white p-1 text-sm">
      {REGIONS.map((r) => {
        const href = r === "망남" ? base : `${base}?region=${r}`;
        const on = r === region;
        return (
          <Link
            key={r}
            href={href}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              on ? "bg-sea-600 text-white font-semibold" : "text-sea-700 hover:bg-sea-50"
            }`}
          >
            {REGION_LABEL[r]}
          </Link>
        );
      })}
    </div>
  );
}
