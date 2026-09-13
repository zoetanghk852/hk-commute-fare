import type { Locale } from '../i18n/messages'

/** Urban line id → display name (aligned with stations.json lineIds). */
const LINE_LABELS_ZH: Record<string, string> = {
  island: '港島綫',
  'tsuen-wan': '荃灣綫',
  'kwun-tong': '觀塘綫',
  'tung-chung': '東涌綫',
  'tseung-kwan-o': '將軍澳綫',
  'east-rail': '東鐵綫',
  'tuen-ma': '屯馬綫',
  'light-rail': '輕鐵',
}

const LINE_LABELS_EN: Record<string, string> = {
  island: 'Island Line',
  'tsuen-wan': 'Tsuen Wan Line',
  'kwun-tong': 'Kwun Tong Line',
  'tung-chung': 'Tung Chung Line',
  'tseung-kwan-o': 'Tseung Kwan O Line',
  'east-rail': 'East Rail Line',
  'tuen-ma': 'Tuen Ma Line',
  'light-rail': 'Light Rail',
}

/** Light Rail (and similar) numeric route codes, e.g. 507 / 615P. */
const ROUTE_CODE_RE = /^\d/

export function lineLabel(lineId: string, locale: Locale = 'zh'): string {
  const table = locale === 'en' ? LINE_LABELS_EN : LINE_LABELS_ZH
  const known = table[lineId]
  if (known) return known
  if (locale === 'en' && ROUTE_CODE_RE.test(lineId)) {
    return `Route ${lineId}`
  }
  return lineId
}
