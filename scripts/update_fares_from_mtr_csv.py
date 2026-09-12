"""Download MTR open-data CSVs and regenerate src/data/fares.json.

Sources:
  https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv
  https://opendata.mtr.com.hk/data/mtr_lines_fares.csv  (OCT_ADT_FARE)

Usage:
  py -3 scripts/update_fares_from_mtr_csv.py
  py -3 scripts/update_fares_from_mtr_csv.py --dry-run
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIONS_PATH = ROOT / "src" / "data" / "stations.json"
FARES_PATH = ROOT / "src" / "data" / "fares.json"
META_PATH = ROOT / "src" / "data" / "fares.meta.json"

STATIONS_CSV_URL = "https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv"
FARES_CSV_URL = "https://opendata.mtr.com.hk/data/mtr_lines_fares.csv"
DATASET_PAGE = (
    "https://data.gov.hk/tc-data/dataset/mtr-data-routes-fares-barrier-free-facilities"
)


def norm_en(s: str) -> str:
    return re.sub(r"[^a-z]", "", s.lower())


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "hk-commute-fare/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8-sig")


def load_stations() -> list[dict]:
    return json.loads(STATIONS_PATH.read_text(encoding="utf-8"))


def build_slug_lookups(stations: list[dict]) -> tuple[dict[str, str], dict[str, str]]:
    en_to_slug = {norm_en(s["nameEn"]): s["id"] for s in stations}
    zh_to_slug = {s["nameZh"].replace(" ", ""): s["id"] for s in stations}
    return en_to_slug, zh_to_slug


def map_station_ids(
    stations_csv: str,
    en_to_slug: dict[str, str],
    zh_to_slug: dict[str, str],
    our_ids: set[str],
) -> tuple[dict[str, str], int]:
    """Return Station ID -> slug for stations in stations.json; count unmapped CSV rows skipped."""
    reader = csv.DictReader(io.StringIO(stations_csv))
    id_to_slug: dict[str, str] = {}
    unmapped_ids = 0
    seen_ids: set[str] = set()

    for row in reader:
        sid = (row.get("Station ID") or "").strip()
        if not sid or sid in seen_ids:
            # Same physical station appears once per line; first mapping wins if consistent.
            if sid and sid in id_to_slug:
                en = (row.get("English Name") or "").strip()
                zh = (row.get("Chinese Name") or "").strip()
                slug = en_to_slug.get(norm_en(en)) or zh_to_slug.get(zh.replace(" ", ""))
                if slug and id_to_slug[sid] != slug:
                    raise SystemExit(
                        f"Station ID {sid} maps to both {id_to_slug[sid]!r} and {slug!r}"
                    )
            continue

        seen_ids.add(sid)
        en = (row.get("English Name") or "").strip()
        zh = (row.get("Chinese Name") or "").strip()
        slug = en_to_slug.get(norm_en(en)) or zh_to_slug.get(zh.replace(" ", ""))
        if not slug or slug not in our_ids:
            unmapped_ids += 1
            continue
        id_to_slug[sid] = slug

    mapped_slugs = set(id_to_slug.values())
    missing = sorted(our_ids - mapped_slugs)
    if missing:
        raise SystemExit(
            "stations.json entries not found in MTR stations CSV: " + ", ".join(missing)
        )

    return id_to_slug, unmapped_ids


def build_fares(
    fares_csv: str,
    id_to_slug: dict[str, str],
) -> tuple[dict[str, float], int, int, int]:
    """Return matrix, skipped_same, skipped_nonpositive, conflict count (exits on conflict)."""
    reader = csv.DictReader(io.StringIO(fares_csv))
    fares: dict[str, float] = {}
    skipped_same = 0
    skipped_nonpositive = 0
    skipped_unmapped = 0

    for row in reader:
        src_id = (row.get("SRC_STATION_ID") or "").strip()
        dest_id = (row.get("DEST_STATION_ID") or "").strip()
        from_slug = id_to_slug.get(src_id)
        to_slug = id_to_slug.get(dest_id)
        if not from_slug or not to_slug:
            skipped_unmapped += 1
            continue
        if from_slug == to_slug:
            skipped_same += 1
            continue
        try:
            amount = float(row.get("OCT_ADT_FARE") or "")
        except ValueError as exc:
            raise SystemExit(
                f"Invalid OCT_ADT_FARE for {src_id}->{dest_id}: {row.get('OCT_ADT_FARE')!r}"
            ) from exc
        if amount <= 0:
            skipped_nonpositive += 1
            continue

        # Keep one decimal place like existing matrix (4.9, 13.2, …).
        amount = round(amount, 1)
        key = f"{from_slug}:{to_slug}"
        existing = fares.get(key)
        if existing is not None and existing != amount:
            raise SystemExit(
                f"Conflicting fare for {key}: {existing} vs {amount} "
                f"(SRC={src_id}, DEST={dest_id})"
            )
        fares[key] = amount

    return fares, skipped_same, skipped_nonpositive, skipped_unmapped


def diff_summary(old: dict[str, float], new: dict[str, float]) -> str:
    old_keys = set(old)
    new_keys = set(new)
    added = sorted(new_keys - old_keys)
    removed = sorted(old_keys - new_keys)
    changed = sorted(
        k for k in (old_keys & new_keys) if float(old[k]) != float(new[k])
    )
    lines = [
        f"  keys: {len(old)} -> {len(new)}",
        f"  added: {len(added)}, removed: {len(removed)}, amount changed: {len(changed)}",
    ]
    if added[:5]:
        lines.append("  sample added: " + ", ".join(added[:5]))
    if removed[:5]:
        lines.append("  sample removed: " + ", ".join(removed[:5]))
    if changed[:5]:
        samples = ", ".join(f"{k} ({old[k]} -> {new[k]})" for k in changed[:5])
        lines.append("  sample changed: " + samples)
    return "\n".join(lines)


def write_meta(pair_count: int, station_count: int, as_of: str) -> None:
    undirected_approx = pair_count // 2
    meta = {
        "asOf": as_of,
        "currency": "HKD",
        "appliesTo": "港鐵市區綫成人八達通單程",
        "appliesToEn": "MTR urban lines adult Octopus single journey",
        "source": (
            "MTR open data CSV: mtr_lines_fares.csv (OCT_ADT_FARE) + "
            "mtr_lines_and_stations.csv, filtered to stations in stations.json"
        ),
        "sourceUrl": DATASET_PAGE,
        "notes": [
            f"Regenerated on {as_of} from {FARES_CSV_URL}",
            f"Matrix covers OD pairs among the {station_count} stations in stations.json "
            f"({undirected_approx}/{pair_count} undirected/directed key pairs as stored)",
            "Same-station rows (fare 0) are omitted; UI treats same station as an error",
            "Station ID is mapped to kebab-case slug via English/Chinese names in stations.json",
            "Regenerate with: pnpm update:fares  (or py -3 scripts/update_fares_from_mtr_csv.py)",
            "Optional dry-run: py -3 scripts/update_fares_from_mtr_csv.py --dry-run",
        ],
    }
    META_PATH.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print summary only; do not write fares.json or fares.meta.json",
    )
    args = parser.parse_args()

    stations = load_stations()
    our_ids = {s["id"] for s in stations}
    en_to_slug, zh_to_slug = build_slug_lookups(stations)

    print(f"Downloading stations CSV…\n  {STATIONS_CSV_URL}")
    stations_csv = fetch_text(STATIONS_CSV_URL)
    print(f"Downloading fares CSV…\n  {FARES_CSV_URL}")
    fares_csv = fetch_text(FARES_CSV_URL)

    id_to_slug, unmapped_station_rows = map_station_ids(
        stations_csv, en_to_slug, zh_to_slug, our_ids
    )
    fares, skipped_same, skipped_nonpositive, skipped_unmapped = build_fares(
        fares_csv, id_to_slug
    )

    sorted_fares = {k: fares[k] for k in sorted(fares)}

    old: dict[str, float] = {}
    if FARES_PATH.exists():
        old = json.loads(FARES_PATH.read_text(encoding="utf-8"))

    print("Summary:")
    print(f"  stations.json: {len(our_ids)}")
    print(f"  Station IDs mapped: {len(id_to_slug)}")
    print(f"  CSV station IDs not in stations.json (skipped): {unmapped_station_rows}")
    print(f"  fare keys: {len(sorted_fares)}")
    print(f"  skipped same-station: {skipped_same}")
    print(f"  skipped non-positive amount: {skipped_nonpositive}")
    print(f"  skipped unmapped OD (outside stations.json): {skipped_unmapped}")
    if "admiralty:mong-kok" in sorted_fares:
        print(f"  sample admiralty:mong-kok = {sorted_fares['admiralty:mong-kok']}")
    if any(k.split(":")[0] == k.split(":")[1] for k in sorted_fares):
        raise SystemExit("Internal error: same-station key present in matrix")
    print("Diff vs existing fares.json:")
    print(diff_summary(old, sorted_fares))

    if args.dry_run:
        print("Dry-run: no files written.")
        return 0

    FARES_PATH.write_text(
        json.dumps(sorted_fares, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    as_of = date.today().isoformat()
    write_meta(len(sorted_fares), len(our_ids), as_of)
    print(f"Wrote {FARES_PATH.relative_to(ROOT)}")
    print(f"Wrote {META_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
