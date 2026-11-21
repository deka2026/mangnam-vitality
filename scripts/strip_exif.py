#!/opt/sakyowon/.venv/bin/python -I
"""올린 사진의 EXIF(촬영 위치 GPS·기기·시각)와 XMP 등 메타데이터를 지우고 같은 자리에 다시 저장한다.

쓰는 법: strip_exif.py <사진 경로>  → stdout JSON {ok, had_exif, had_gps} 또는 {ok:false, error}
- 회전 정보(Orientation)는 그림에 반영(exif_transpose)한 뒤 지운다.
- JPEG·PNG·WebP 를 다룬다. GIF 는 EXIF 칸이 없어 그대로 둔다.
- 지운 뒤 다시 열어 EXIF 가 비었는지 확인한다. 실패하면 ok:false — 부른 쪽이 파일을 버린다.
2026-11-21 데카 — 망남 어촌신활력 사이트 개인정보 조치(이사장 결정).
"""
import json
import os
import sys

from PIL import Image, ImageOps

GPS_IFD = 0x8825


def main(경로: str):
    with Image.open(경로) as im:
        fmt = (im.format or "").upper()
        if fmt == "GIF":
            return {"ok": True, "had_exif": False, "had_gps": False, "skipped": "gif"}
        if fmt not in ("JPEG", "PNG", "WEBP", "MPO"):
            return {"ok": False, "error": f"다루지 않는 그림 형식({fmt})"}
        exif = im.getexif()
        had_exif = bool(exif) or bool(im.info.get("exif")) or bool(im.info.get("xmp"))
        had_gps = GPS_IFD in exif and bool(exif.get_ifd(GPS_IFD))
        icc = im.info.get("icc_profile")
        im.load()
        clean = ImageOps.exif_transpose(im)
        clean = clean.copy()
        clean.info = {}
    tmp = 경로 + ".strip"
    opts = {"exif": b""}
    if icc:
        opts["icc_profile"] = icc
    if fmt in ("JPEG", "MPO"):
        if clean.mode not in ("RGB", "L", "CMYK"):
            clean = clean.convert("RGB")
        clean.save(tmp, "JPEG", quality=95, optimize=True, **opts)
    elif fmt == "PNG":
        clean.save(tmp, "PNG", optimize=True, **opts)
    else:
        clean.save(tmp, "WEBP", quality=95, **opts)
    with Image.open(tmp) as chk:
        if chk.getexif() or chk.info.get("exif") or chk.info.get("xmp"):
            os.remove(tmp)
            return {"ok": False, "error": "메타데이터가 지워지지 않았다"}
    os.replace(tmp, 경로)
    return {"ok": True, "had_exif": had_exif, "had_gps": had_gps}


if __name__ == "__main__":
    try:
        r = main(sys.argv[1])
    except Exception as e:
        r = {"ok": False, "error": str(e)[:200]}
    print(json.dumps(r, ensure_ascii=False))
    sys.exit(0 if r.get("ok") else 1)
