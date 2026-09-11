import { describe, expect, it } from "vitest";
import { searchStations, type Station } from "./searchStations";

/** 測試用小站表（不依賴整份 JSON，案例更穩） */
const stations: Station[] = [
  {
    id: "mong-kok",
    nameZh: "旺角",
    nameEn: "Mong Kok",
    lineIds: ["tsuen-wan", "kwun-tong"],
  },
  {
    id: "admiralty",
    nameZh: "金鐘",
    nameEn: "Admiralty",
    lineIds: ["island", "tsuen-wan"],
  },
  {
    id: "central",
    nameZh: "中環",
    nameEn: "Central",
    lineIds: ["island", "tsuen-wan"],
  },
];

describe("searchStations", () => {
  it('finds Mong Kok when query is "旺"', () => {
    const result = searchStations("旺", stations);
    expect(result.map((s) => s.id)).toContain("mong-kok");
  });

  it('finds Admiralty when query is "adm" (case-insensitive English)', () => {
    const result = searchStations("adm", stations);
    expect(result.map((s) => s.id)).toContain("admiralty");
  });

  it("returns empty array for blank query", () => {
    expect(searchStations("", stations)).toEqual([]);
    expect(searchStations("   ", stations)).toEqual([]);
  });

  it("returns empty array when nothing matches", () => {
    expect(searchStations("zzz", stations)).toEqual([]);
  });

  it("respects locale=zh (English-only query should not match)", () => {
    expect(searchStations("adm", stations, "zh")).toEqual([]);
    expect(searchStations("旺", stations, "zh").map((s) => s.id)).toContain(
      "mong-kok",
    );
  });

  it("respects locale=en (Chinese-only query should not match)", () => {
    expect(searchStations("旺", stations, "en")).toEqual([]);
    expect(searchStations("adm", stations, "en").map((s) => s.id)).toContain(
      "admiralty",
    );
  });
});
