export type Locale = 'zh' | 'en'

export type MessageKey =
  | 'brandEyebrow'
  | 'brandTitle'
  | 'tagline'
  | 'origin'
  | 'destination'
  | 'search'
  | 'byLine'
  | 'line'
  | 'pickStation'
  | 'clear'
  | 'noneSelected'
  | 'selectedPrefix'
  | 'noMatch'
  | 'searchResults'
  | 'selectLine'
  | 'selectStation'
  | 'searchPlaceholder'
  | 'swap'
  | 'langZh'
  | 'langEn'
  | 'incomplete'
  | 'sameStation'
  | 'missingFare'
  | 'fareQuery'
  | 'language'
  | 'journeyUnknown'
  | 'dataAsOf'

const zh = {
  brandEyebrow: '港鐵車費',
  brandTitle: 'HK通勤車費查詢',
  tagline: '港鐵市區綫成人八達通單程車費',
  origin: '起點',
  destination: '終點',
  search: '搜尋',
  byLine: '按綫選站',
  line: '綫別',
  pickStation: '選站',
  clear: '清除',
  noneSelected: '尚未選站',
  selectedPrefix: '已選：',
  noMatch: '沒有符合的車站',
  searchResults: '搜尋結果',
  selectLine: '選擇綫別',
  selectStation: '選站',
  searchPlaceholder: '請選擇車站',
  swap: '對調起訖',
  langZh: '繁中',
  langEn: 'English',
  incomplete: '請選擇起訖站',
  sameStation: '起點與終點不可相同',
  missingFare: '無法顯示該程車費',
  fareQuery: '車費查詢',
  language: '語言',
  journeyUnknown: '？',
  dataAsOf: '票價資料截至 {date}（港鐵成人八達通公開車費表）',
} as const satisfies Record<MessageKey, string>

const en: Record<MessageKey, string> = {
  brandEyebrow: 'MTR fare',
  brandTitle: 'HK Commute Fare',
  tagline: 'MTR urban lines adult Octopus single journey',
  origin: 'Origin',
  destination: 'Destination',
  search: 'search',
  byLine: 'Pick by line',
  line: 'line',
  pickStation: 'station',
  clear: 'Clear',
  noneSelected: 'No station selected',
  selectedPrefix: 'Selected: ',
  noMatch: 'No matching stations',
  searchResults: 'search results',
  selectLine: 'Select line',
  selectStation: 'Select station',
  searchPlaceholder: 'Please select a station',
  swap: 'Swap origin and destination',
  langZh: '繁中',
  langEn: 'English',
  incomplete: 'Select origin and destination',
  sameStation: 'Origin and destination must differ',
  missingFare: 'Fare unavailable for this journey',
  fareQuery: 'Fare lookup',
  language: 'Language',
  journeyUnknown: '?',
  dataAsOf: 'Fares as of {date} (MTR Adult Octopus published chart)',
}

export const messages: Record<Locale, Record<MessageKey, string>> = {
  zh,
  en,
}

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key]
}

/** Browser language: zh* → Traditional Chinese, otherwise English */
export function detectLocale(
  language: string = typeof navigator !== 'undefined' ? navigator.language : 'zh-HK',
): Locale {
  return language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function stationPrimaryName(
  station: { nameZh: string; nameEn: string },
  locale: Locale,
): string {
  return locale === 'en' ? station.nameEn : station.nameZh
}

export function stationSecondaryName(
  station: { nameZh: string; nameEn: string },
  locale: Locale,
): string {
  return locale === 'en' ? station.nameZh : station.nameEn
}
