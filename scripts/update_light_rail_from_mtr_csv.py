"""Download MTR Light Rail open-data CSVs and regenerate:

  src/data/light-rail-stations.json
  src/data/light-rail-fares.json
  src/data/light-rail-fares.meta.json
  src/data/light-rail-routes.json

Sources:
  https://opendata.mtr.com.hk/data/light_rail_routes_and_stops.csv
  https://opendata.mtr.com.hk/data/light_rail_fares.csv  (fare_octo_adult)

Usage:
  py -3 scripts/update_light_rail_from_mtr_csv.py
  py -3 scripts/update_light_rail_from_mtr_csv.py --dry-run
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
STATIONS_PATH = ROOT / "src" / "data" / "light-rail-stations.json"
FARES_PATH = ROOT / "src" / "data" / "light-rail-fares.json"
META_PATH = ROOT / "src" / "data" / "light-rail-fares.meta.json"
ROUTES_PATH = ROOT / "src" / "data" / "light-rail-routes.json"
MTR_STATIONS_PATH = ROOT / "src" / "data" / "stations.json"

STOPS_CSV_URL = "https://opendata.mtr.com.hk/data/light_rail_routes_and_stops.csv"
FARES_CSV_URL = "https://opendata.mtr.com.hk/data/light_rail_fares.csv"
DATASET_PAGE = (
    "https://data.gov.hk/tc-data/dataset/mtr-data-routes-fares-barrier-free-facilities"
)

# Stable slugs for stops already referenced in tests / V2a journeys.
PREFERRED_SLUGS: dict[str, str] = {
    "Tuen Mun": "lr-tuen-mun",
    "Town Centre": "lr-town-centre",
    "Siu Hong": "lr-siu-hong",
    "Tin Shui Wai": "lr-tin-shui-wai",
    "Yuen Long": "lr-yuen-long",
    "On Ting": "lr-on-ting",
    "Prime View": "lr-prime-view",
    "Hung Shui Kiu": "lr-hung-shui-kiu",
}

# English LR stop name -> MTR heavy-rail station id in stations.json
INTERCHANGE_BY_EN: dict[str, str] = {
    "Tuen Mun": "tuen-mun",
    "Siu Hong": "siu-hong",
    "Tin Shui Wai": "tin-shui-wai",
    "Yuen Long": "yuen-long",
}

_LINE_CODE_SORT_RE = re.compile(r"^(\d+)(.*)$")


def line_code_sort_key(code: str) -> tuple[int, str, str]:
    m = _LINE_CODE_SORT_RE.match(code)
    if m:
        return (int(m.group(1)), m.group(2), code)
    return (10**9, code, code)


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "hk-commute-fare/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8-sig")


def slugify_en(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"lr-{slug}"


def load_existing_coords() -> tuple[dict[str, tuple[float, float]], dict[str, tuple[float, float]]]:
    if not STATIONS_PATH.exists():
        return {}, {}
    existing = json.loads(STATIONS_PATH.read_text(encoding="utf-8"))
    by_id: dict[str, tuple[float, float]] = {}
    by_en: dict[str, tuple[float, float]] = {}
    for row in existing:
        lat, lng = row.get("lat"), row.get("lng")
        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
            pair = (float(lat), float(lng))
            by_id[row["id"]] = pair
            by_en[row["nameEn"]] = pair
    return by_id, by_en


def build_stations(
    stops_csv: str, mtr_ids: set[str]
) -> tuple[list[dict], dict[str, str], dict[str, list[str]]]:
    """Return stations list, Stop ID -> slug, and Line Code -> ordered stop slugs (Direction 1)."""
    reader = csv.DictReader(io.StringIO(stops_csv))
    by_stop_id: dict[str, dict] = {}
    line_ids_by_stop: dict[str, set[str]] = {}
    # route -> list of (sequence, stop_id)
    route_seq: dict[str, list[tuple[int, str]]] = {}

    for row in reader:
        stop_id = (row.get("Stop ID") or "").strip()
        line_code = (row.get("Line Code") or "").strip()
        if not stop_id:
            continue

        en = (row.get("English Name") or "").strip()
        zh = (row.get("Chinese Name") or "").strip()

        if stop_id not in by_stop_id:
            if not en or not zh:
                raise SystemExit(f"Stop {stop_id} missing name: en={en!r} zh={zh!r}")
            slug = PREFERRED_SLUGS.get(en) or slugify_en(en)
            station: dict = {
                "id": slug,
                "nameZh": zh,
                "nameEn": en,
                "lineIds": [],
                "stopId": stop_id,
            }
            interchange = INTERCHANGE_BY_EN.get(en)
            if interchange and interchange in mtr_ids:
                station["mtrInterchangeId"] = interchange
            by_stop_id[stop_id] = station
            line_ids_by_stop[stop_id] = set()

        if line_code:
            line_ids_by_stop[stop_id].add(line_code)
            direction = (row.get("Direction") or "").strip()
            if direction == "1":
                try:
                    seq = int((row.get("Sequence") or "").strip())
                except ValueError as exc:
                    raise SystemExit(
                        f"Invalid Sequence for route {line_code} stop {stop_id}: "
                        f"{row.get('Sequence')!r}"
                    ) from exc
                route_seq.setdefault(line_code, []).append((seq, stop_id))

    for stop_id, station in by_stop_id.items():
        codes = sorted(line_ids_by_stop.get(stop_id, ()), key=line_code_sort_key)
        if not codes:
            raise SystemExit(f"Stop {stop_id} ({station['nameEn']}) has no Line Code")
        station["lineIds"] = codes

    coords_by_id, coords_by_en = load_existing_coords()
    stations = sorted(by_stop_id.values(), key=lambda s: int(s["stopId"]))
    for station in stations:
        pair = coords_by_id.get(station["id"]) or coords_by_en.get(station["nameEn"])
        if pair:
            station["lat"], station["lng"] = pair

    id_to_slug = {sid: st["id"] for sid, st in by_stop_id.items()}
    # Ensure slug uniqueness
    slugs = [s["id"] for s in stations]
    if len(slugs) != len(set(slugs)):
        raise SystemExit("Duplicate Light Rail station slugs generated")

    routes: dict[str, list[str]] = {}
    for code in sorted(route_seq.keys(), key=line_code_sort_key):
        ordered = sorted(route_seq[code], key=lambda t: t[0])
        seen: set[str] = set()
        stop_ids: list[str] = []
        for _seq, sid in ordered:
            slug = id_to_slug[sid]
            if slug in seen:
                continue
            seen.add(slug)
            stop_ids.append(slug)
        routes[code] = stop_ids

    return stations, id_to_slug, routes


def build_fares(
    fares_csv: str,
    id_to_slug: dict[str, str],
) -> tuple[dict[str, float], int, int, int]:
    reader = csv.DictReader(io.StringIO(fares_csv))
    fares: dict[str, float] = {}
    skipped_same = 0
    skipped_nonpositive = 0
    skipped_unmapped = 0

    for row in reader:
        src = (row.get("from_station_id") or "").strip()
        dest = (row.get("to_station_id") or "").strip()
        from_slug = id_to_slug.get(src)
        to_slug = id_to_slug.get(dest)
        if not from_slug or not to_slug:
            skipped_unmapped += 1
            continue
        if from_slug == to_slug:
            skipped_same += 1
            continue
        try:
            amount = float(row.get("fare_octo_adult") or "")
        except ValueError as exc:
            raise SystemExit(
                f"Invalid fare_octo_adult for {src}->{dest}: {row.get('fare_octo_adult')!r}"
            ) from exc
        if amount <= 0:
            skipped_nonpositive += 1
            continue
        amount = round(amount, 1)
        key = f"{from_slug}:{to_slug}"
        existing = fares.get(key)
        if existing is not None and existing != amount:
            raise SystemExit(f"Conflicting fare for {key}: {existing} vs {amount}")
        fares[key] = amount

    return fares, skipped_same, skipped_nonpositive, skipped_unmapped


def strip_stop_id_for_export(stations: list[dict]) -> list[dict]:
    """Export public station shape without CSV Stop ID."""
    out = []
    for s in stations:
        row = {
            "id": s["id"],
            "nameZh": s["nameZh"],
            "nameEn": s["nameEn"],
            "lineIds": s["lineIds"],
        }
        if "mtrInterchangeId" in s:
            row["mtrInterchangeId"] = s["mtrInterchangeId"]
        if "lat" in s and "lng" in s:
            row["lat"] = s["lat"]
            row["lng"] = s["lng"]
        out.append(row)
    return out


def write_meta(pair_count: int, station_count: int, route_count: int, as_of: str) -> None:
    meta = {
        "asOf": as_of,
        "currency": "HKD",
        "appliesTo": "輕鐵成人八達通單程",
        "appliesToEn": "Light Rail adult Octopus single journey",
        "source": (
            "MTR open data CSV: light_rail_fares.csv (fare_octo_adult) + "
            "light_rail_routes_and_stops.csv"
        ),
        "sourceUrl": DATASET_PAGE,
        "mtrLrFreeAdultMax": 5.4,
        "notes": [
            f"Regenerated on {as_of} from {FARES_CSV_URL}",
            f"Full network: {station_count} stops, {pair_count} directed adult Octopus OD keys",
            f"Route numbers: {route_count} Line Codes in light-rail-routes.json (Direction 1 order)",
            "Same-station rows (fare 0) omitted; UI treats same station as an error",
            "mtr_lr_free applies when Light Rail adult fare ≤ $5.4",
            "Regenerate with: py -3 scripts/update_light_rail_from_mtr_csv.py",
            "Optional dry-run: py -3 scripts/update_light_rail_from_mtr_csv.py --dry-run",
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
        help="Print summary only; do not write JSON files",
    )
    args = parser.parse_args()

    mtr_stations = json.loads(MTR_STATIONS_PATH.read_text(encoding="utf-8"))
    mtr_ids = {s["id"] for s in mtr_stations}

    print(f"Downloading stops CSV…\n  {STOPS_CSV_URL}")
    stops_csv = fetch_text(STOPS_CSV_URL)
    print(f"Downloading fares CSV…\n  {FARES_CSV_URL}")
    fares_csv = fetch_text(FARES_CSV_URL)

    stations, id_to_slug, routes = build_stations(stops_csv, mtr_ids)
    fares, skipped_same, skipped_nonpositive, skipped_unmapped = build_fares(
        fares_csv, id_to_slug
    )
    sorted_fares = {k: fares[k] for k in sorted(fares)}
    export_stations = strip_stop_id_for_export(stations)

    print("Summary:")
    print(f"  stops: {len(export_stations)}")
    print(f"  routes (Direction 1): {len(routes)}")
    print(f"  Stop IDs mapped: {len(id_to_slug)}")
    print(f"  fare keys: {len(sorted_fares)}")
    print(f"  skipped same-station: {skipped_same}")
    print(f"  skipped non-positive: {skipped_nonpositive}")
    print(f"  skipped unmapped OD: {skipped_unmapped}")
    if "507" in routes:
        print(f"  sample route 507 stops: {len(routes['507'])}")
    sample_key = "lr-tuen-mun:lr-town-centre"
    if sample_key in sorted_fares:
        print(f"  sample {sample_key} = {sorted_fares[sample_key]}")
    else:
        raise SystemExit(f"Missing expected sample fare {sample_key}")

    expected_pairs = len(export_stations) * (len(export_stations) - 1)
    if len(sorted_fares) != expected_pairs:
        raise SystemExit(
            f"Expected {expected_pairs} directed OD keys, got {len(sorted_fares)}"
        )

    if args.dry_run:
        print("Dry-run: no files written.")
        return 0

    STATIONS_PATH.write_text(
        json.dumps(export_stations, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    FARES_PATH.write_text(
        json.dumps(sorted_fares, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    ROUTES_PATH.write_text(
        json.dumps(routes, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    as_of = date.today().isoformat()
    write_meta(len(sorted_fares), len(export_stations), len(routes), as_of)
    print(f"Wrote {STATIONS_PATH.relative_to(ROOT)}")
    print(f"Wrote {FARES_PATH.relative_to(ROOT)}")
    print(f"Wrote {ROUTES_PATH.relative_to(ROOT)}")
    print(f"Wrote {META_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
