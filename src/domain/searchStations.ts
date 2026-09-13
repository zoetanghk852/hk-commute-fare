export type Station = {
  id: string;
  nameZh: string;
  nameEn: string;
  lineIds: string[];
  /** Optional geographic coordinates for map markers */
  lat?: number;
  lng?: number;
  /** For Light Rail stations: the corresponding MTR station ID at the interchange */
  mtrInterchangeId?: string;
};

/** Light Rail route numbers (e.g. 507, 615P) — not MTR line slugs. */
const ROUTE_NUMBER_RE = /^\d/;

/**
 * Exact match of a Light Rail route number against known lineIds (case-insensitive).
 * Partial queries like "61" return null so the user keeps typing.
 */
export function resolveExactRouteId(
  query: string,
  lineIds: string[],
): string | null {
  const q = query.trim().toLowerCase();
  if (!q || !ROUTE_NUMBER_RE.test(q)) return null;
  return lineIds.find((id) => id.toLowerCase() === q) ?? null;
}

/**
 * 依關鍵字篩選車站。
 * - 未指定 locale：中英文站名都比對
 * - locale === 'zh'：只比 nameZh
 * - locale === 'en'：只比 nameEn（不分大小寫）
 * - 空白 query → []
 * - 另比對輕鐵路線編號（lineIds 以數字開頭者）；不比對港鐵綫別 slug
 */
export function searchStations(
  query: string,
  stations: Station[],
  locale?: "zh" | "en",
): Station[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [];
  }

  return stations.filter((station) => {
    if (
      station.lineIds.some(
        (id) => ROUTE_NUMBER_RE.test(id) && id.toLowerCase().includes(q),
      )
    ) {
      return true;
    }

    const zh = station.nameZh.toLowerCase();
    const en = station.nameEn.toLowerCase();

    if (locale === "zh") {
      return zh.includes(q);
    }
    if (locale === "en") {
      return en.includes(q);
    }
    // 未指定：中英都搜（適合預設搜尋框）
    return zh.includes(q) || en.includes(q);
  });
}
