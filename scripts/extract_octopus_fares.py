"""Offline extract Adult Octopus fares from MTR PDF into fares.json keys."""
from __future__ import annotations

import json
import pathlib
import re

import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parents[1]
PDF = pathlib.Path.home() / "AppData/Local/Temp/mtr_octopus_fare_2024.pdf"
STATIONS_PATH = ROOT / "src/data/stations.json"
OUT_FARES = ROOT / "src/data/fares.json"
SUMMARY = pathlib.Path.home() / "AppData/Local/Temp/mtr_parse_summary.json"


def norm_en(s: str) -> str:
    return re.sub(r"[^a-z]", "", s.lower())


def clean(c: str | None) -> str | None:
    if c is None:
        return None
    return c.replace("\n", "").strip()


def iter_fare_tables(tables: list) -> list:
    """Yield OD matrices on a page (a page may have two destination blocks)."""
    found = []
    for t in tables:
        if not t or len(t) < 4:
            continue
        en_row = " ".join(clean(c) or "" for c in t[2])
        if any(
            marker in en_row
            for marker in (
                "KennedyTown",
                "MongKok",
                "HongKong",
                "TsingYi",
                "WuKaiSha",
                "TuenMun",
                "TseungKwanO",
            )
        ):
            found.append(t)
    return found


def match_origin(
    origin_cell: str,
    zh_to_id: dict[str, str],
    en_to_id: dict[str, str],
) -> str | None:
    for zh, sid in sorted(zh_to_id.items(), key=lambda x: -len(x[0])):
        if not origin_cell.startswith(zh):
            continue
        rest = origin_cell[len(zh) :].lstrip()
        # Reject 香港大學 matching 香港: next char must be Latin (or end).
        if rest == "" or (rest[0].isascii() and rest[0].isalpha()):
            return sid
    m = re.search(r"[A-Za-z].*", origin_cell)
    if m:
        return en_to_id.get(norm_en(m.group(0)))
    return None


def main() -> None:
    stations = json.loads(STATIONS_PATH.read_text(encoding="utf-8"))
    zh_to_id = {s["nameZh"].replace(" ", ""): s["id"] for s in stations}
    en_to_id = {norm_en(s["nameEn"]): s["id"] for s in stations}
    our_ids = {s["id"] for s in stations}

    fares: dict[str, float] = {}
    votes: dict[str, dict[float, int]] = {}
    pages_used: list[dict] = []

    with pdfplumber.open(str(PDF)) as pdf:
        # Adult Octopus charts: PDF pages 2–10
        for pi in range(1, 10):
            tables = pdf.pages[pi].extract_tables() or []
            fare_tables = iter_fare_tables(tables)
            if not fare_tables:
                continue

            for t in fare_tables:
                dest_zh = [clean(c) for c in t[1]]
                dest_en = [clean(c) for c in t[2]]
                col_ids: list[str | None] = []
                for i in range(len(dest_zh)):
                    zh = dest_zh[i] or ""
                    en = dest_en[i] or ""
                    sid = zh_to_id.get(zh) or en_to_id.get(norm_en(en))
                    col_ids.append(sid)

                pages_used.append(
                    {
                        "page": pi + 1,
                        "mapped_cols": sum(1 for x in col_ids if x),
                        "total_cols": len(col_ids),
                    }
                )

                for row in t[3:]:
                    origin_cell = clean(row[1]) if len(row) > 1 else None
                    if not origin_cell:
                        continue
                    oid = match_origin(origin_cell, zh_to_id, en_to_id)
                    if oid is None or oid not in our_ids:
                        continue

                    for ci, to_id in enumerate(col_ids):
                        if to_id is None or to_id not in our_ids or to_id == oid:
                            continue
                        if ci >= len(row):
                            continue
                        val = clean(row[ci])
                        if not val:
                            continue
                        try:
                            amount = float(val)
                        except ValueError:
                            continue
                        key = f"{oid}:{to_id}"
                        bucket = votes.setdefault(key, {})
                        bucket[amount] = bucket.get(amount, 0) + 1

    # Majority vote per OD (duplicate columns / pages)
    for key, bucket in votes.items():
        amount = max(bucket.items(), key=lambda x: (x[1], -x[0]))[0]
        fares[key] = amount

    undirected = 0
    missing_pairs: list[str] = []
    for a in sorted(our_ids):
        for b in sorted(our_ids):
            if a >= b:
                continue
            if f"{a}:{b}" in fares or f"{b}:{a}" in fares:
                undirected += 1
            else:
                missing_pairs.append(f"{a}|{b}")

    # Prefer storing both directions when we have them; reverse lookup covers one-sided.
    summary = {
        "fareCount": len(fares),
        "undirectedPairsWithAnyDir": undirected,
        "maxUndirected": len(our_ids) * (len(our_ids) - 1) // 2,
        "missingUndirectedCount": len(missing_pairs),
        "missingUndirectedSample": missing_pairs[:40],
        "pages": pages_used,
        "spotChecks": {
            k: fares.get(k)
            for k in (
                "admiralty:mong-kok",
                "mong-kok:admiralty",
                "wan-chai:kwun-tong",
                "central:causeway-bay",
                "admiralty:wan-chai",
                "hong-kong:kowloon",
            )
        },
        "sourcePdf": "adu_chd_ocl_mtr_fare_2024.pdf",
        "effectiveFrom": "2024-06-30",
        "note": "Adult Octopus chart (product scope); not single-journey sjst PDF",
    }
    SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    sorted_fares = {k: fares[k] for k in sorted(fares)}
    OUT_FARES.write_text(
        json.dumps(sorted_fares, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
