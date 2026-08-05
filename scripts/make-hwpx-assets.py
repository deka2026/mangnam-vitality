#!/usr/bin/env python3
"""lib/hwpx-assets.ts 생성 스크립트.

실제 한글(HWPX) 문서에서 추출한 header.xml에 문서 생성용 커스텀 스타일
(제목·소제목·본문·표 머리글)을 추가해 TS 자산 파일로 굽는다.

원본 샘플: ~/workspace/mangnam-jaryo-files/_20250731_.hwpx (데카 로컬 전용 —
생성 결과물 lib/hwpx-assets.ts 는 커밋되므로 이 스크립트는 재생성할 때만 필요)
"""
import re
import sys
import zipfile
from pathlib import Path

SAMPLE = Path.home() / "workspace/mangnam-jaryo-files/_20250731_.hwpx"
OUT = Path(__file__).resolve().parent.parent / "lib/hwpx-assets.ts"

header = zipfile.ZipFile(SAMPLE).read("Contents/header.xml").decode("utf-8")

# ---------- 커스텀 borderFill (id 12: 표 머리글 셀 — 실선 테두리 + 옅은 회청색 채움) ----------
BORDER_FILL_12 = (
    '<hh:borderFill id="12" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0">'
    '<hh:slash type="NONE" Crooked="0" isCounter="0"/><hh:backSlash type="NONE" Crooked="0" isCounter="0"/>'
    '<hh:leftBorder type="SOLID" width="0.12 mm" color="#000000"/><hh:rightBorder type="SOLID" width="0.12 mm" color="#000000"/>'
    '<hh:topBorder type="SOLID" width="0.12 mm" color="#000000"/><hh:bottomBorder type="SOLID" width="0.12 mm" color="#000000"/>'
    '<hh:diagonal type="SOLID" width="0.1 mm" color="#000000"/>'
    '<hc:fillBrush><hc:winBrush faceColor="#E8EEF4" hatchColor="#000000" alpha="0"/></hc:fillBrush>'
    "</hh:borderFill>"
)

# ---------- 커스텀 charPr ----------
def char_pr(cid: int, height: int, font: str, bold: bool) -> str:
    b = "<hh:bold/>" if bold else ""
    return (
        f'<hh:charPr id="{cid}" height="{height}" textColor="#000000" shadeColor="none" '
        'useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="2">'
        f'<hh:fontRef hangul="{font}" latin="{font}" hanja="{font}" japanese="{font}" other="{font}" symbol="{font}" user="{font}"/>'
        '<hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>'
        '<hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>'
        '<hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>'
        '<hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>'
        f"{b}"
        '<hh:underline type="NONE" shape="SOLID" color="#000000"/><hh:strikeout shape="NONE" color="#000000"/>'
        '<hh:outline type="NONE"/><hh:shadow type="NONE" color="#B2B2B2" offsetX="10" offsetY="10"/>'
        "</hh:charPr>"
    )

# font 1 = 함초롬돋움(제목 계열), font 2 = 함초롬바탕(본문 계열)
CHAR_PRS = [
    char_pr(100, 1000, "2", False),  # 본문 10pt
    char_pr(101, 1700, "1", True),   # 문서 제목 17pt
    char_pr(102, 1400, "1", True),   # 대제목(##) 14pt
    char_pr(103, 1200, "1", True),   # 중제목(###) 12pt
    char_pr(104, 1100, "1", True),   # 소제목(####) 11pt
    char_pr(105, 1000, "2", True),   # 본문 굵게
    char_pr(106, 1000, "1", True),   # 표 머리글
    char_pr(107, 900, "2", False),   # 작은 글씨(부제·날짜)
]

# ---------- 커스텀 paraPr ----------
def para_pr(pid: int, align: str, *, left=0, intent=0, prev=0, nxt=0, keep_next=0, line=160) -> str:
    margin = (
        f'<hh:margin><hc:intent value="{intent}" unit="HWPUNIT"/><hc:left value="{left}" unit="HWPUNIT"/>'
        '<hc:right value="0" unit="HWPUNIT"/>'
        f'<hc:prev value="{prev}" unit="HWPUNIT"/><hc:next value="{nxt}" unit="HWPUNIT"/></hh:margin>'
        f'<hh:lineSpacing type="PERCENT" value="{line}" unit="HWPUNIT"/>'
    )
    return (
        f'<hh:paraPr id="{pid}" tabPrIDRef="0" condense="0" fontLineHeight="0" snapToGrid="1" '
        'suppressLineNumbers="0" checked="0">'
        f'<hh:align horizontal="{align}" vertical="BASELINE"/>'
        '<hh:heading type="NONE" idRef="0" level="0"/>'
        '<hh:breakSetting breakLatinWord="KEEP_WORD" breakNonLatinWord="BREAK_WORD" widowOrphan="0" '
        f'keepWithNext="{keep_next}" keepLines="0" pageBreakBefore="0" lineWrap="BREAK"/>'
        '<hh:autoSpacing eAsianEng="0" eAsianNum="0"/>'
        '<hp:switch><hp:case hp:required-namespace="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar">'
        f"{margin}</hp:case><hp:default>{margin}</hp:default></hp:switch>"
        '<hh:border borderFillIDRef="2" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" '
        'connect="0" ignoreMargin="0"/>'
        "</hh:paraPr>"
    )

PARA_PRS = [
    para_pr(100, "CENTER", prev=850, nxt=1150),                 # 문서 제목
    para_pr(101, "LEFT", prev=850, nxt=280, keep_next=1),       # 소제목(heading)
    para_pr(102, "JUSTIFY", nxt=170),                           # 본문
    para_pr(103, "LEFT", left=1200, intent=-600, nxt=110),      # 목록(글머리 내어쓰기)
    para_pr(104, "CENTER", line=150),                           # 표 머리글 셀
    para_pr(105, "LEFT", line=150),                             # 표 본문 셀
    para_pr(106, "RIGHT", prev=280, nxt=280),                   # 오른쪽 정렬(날짜·서명)
]

def bump(xml: str, tag: str, added: int) -> str:
    m = re.search(rf'<hh:{tag} itemCnt="(\d+)"', xml)
    return xml.replace(m.group(0), f'<hh:{tag} itemCnt="{int(m.group(1)) + added}"', 1)

header = header.replace("</hh:borderFills>", BORDER_FILL_12 + "</hh:borderFills>", 1)
header = header.replace("</hh:charProperties>", "".join(CHAR_PRS) + "</hh:charProperties>", 1)
header = header.replace("</hh:paraProperties>", "".join(PARA_PRS) + "</hh:paraProperties>", 1)
header = bump(header, "borderFills", 1)
header = bump(header, "charProperties", len(CHAR_PRS))
header = bump(header, "paraProperties", len(PARA_PRS))

# XML 유효성 확인
import xml.dom.minidom
xml.dom.minidom.parseString(header)

def ts_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

OUT.write_text(
    "// 이 파일은 scripts/make-hwpx-assets.py 가 생성한다. 직접 수정하지 말 것.\n"
    "// 실제 한글(HWPX) 문서의 header.xml 에 문서 생성용 커스텀 스타일을 추가한 것.\n"
    "// 커스텀 ID — charPr: 100 본문 / 101 제목 / 102 ## / 103 ### / 104 #### / 105 굵게 / 106 표머리글 / 107 작은글씨\n"
    "//            paraPr: 100 제목 / 101 소제목 / 102 본문 / 103 목록 / 104 표머리셀 / 105 표본문셀 / 106 오른쪽정렬\n"
    "//            borderFill: 4 표 외곽 / 8 표 셀 / 12 표 머리글 셀(채움)\n"
    f"export const HEADER_XML = `{ts_escape(header)}`;\n",
    encoding="utf-8",
)
print(f"OK {OUT} ({OUT.stat().st_size:,} bytes)")
