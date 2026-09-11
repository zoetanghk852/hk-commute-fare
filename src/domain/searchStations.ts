export type Station = {
  id: string;
  nameZh: string;
  nameEn: string;
  lineIds: string[];
};

/**
 * 依關鍵字篩選車站。
 * - 未指定 locale：中英文站名都比對
 * - locale === 'zh'：只比 nameZh
 * - locale === 'en'：只比 nameEn（不分大小寫）
 * - 空白 query → []
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
