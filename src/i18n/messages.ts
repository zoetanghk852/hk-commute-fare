export type Locale = "zh" | "en";

export type MessageKey =
  | "brandEyebrow"
  | "brandTitle"
  | "tagline"
  | "origin"
  | "destination"
  | "search"
  | "byLine"
  | "line"
  | "pickStation"
  | "clear"
  | "noneSelected"
  | "selectedPrefix"
  | "noMatch"
  | "searchResults"
  | "selectLine"
  | "selectStation"
  | "searchPlaceholder"
  | "searchPlaceholderRoute"
  | "swap"
  | "langZh"
  | "langEn"
  | "incomplete"
  | "sameStation"
  | "missingFare"
  | "unknownStation"
  | "fareQuery"
  | "language"
  | "journeyUnknown"
  | "dataAsOf"
  // Day3: multi-leg, early bird, personal %, breakdown
  | "addSecondLeg"
  | "removeSecondLeg"
  | "secondLegTitle"
  | "swapLegs"
  | "dragLegHandle"
  | "legMode"
  | "modeMtr"
  | "modeLightRail"
  | "modeBusDisabled"
  | "interchangeAuto"
  | "earlyBird"
  | "earlyBirdNote"
  | "earlyBirdRef"
  | "personalPercent"
  | "personalPercentNote"
  | "fareBreakdown"
  | "officialSubtotal"
  | "interchangeDiscount"
  | "afterInterchange"
  | "earlyBirdDiscount"
  | "afterEarlyBird"
  | "personalDiscount"
  | "estimatedPayable"
  | "mtrLrFreeLabel"
  | "mtrLrFreeApplicable"
  | "mtrLrFreeNotApplicable"
  | "mtrLrFreeNote"
  | "mtrLrFreeRef"
  | "officialLabel"
  | "personalLabel"
  // Day3: navigation
  | "homeNav"
  | "fareSaverNav"
  // Day3: fare saver page
  | "fareSaverTitle"
  | "fareSaverDisclaimer"
  | "fareSaverStation"
  | "fareSaverLocation"
  // Day4: map
  | "mapTitle";

const zh = {
  brandEyebrow: "港鐵車費",
  brandTitle: "HK通勤車費查詢",
  tagline: "港鐵市區綫成人八達通單程車費",
  origin: "起點",
  destination: "終點",
  search: "搜尋",
  byLine: "按綫選站",
  line: "綫別",
  pickStation: "選站",
  clear: "清除",
  noneSelected: "尚未選站",
  selectedPrefix: "已選：",
  noMatch: "沒有符合的車站",
  searchResults: "搜尋結果",
  selectLine: "選擇綫別",
  selectStation: "選站",
  searchPlaceholder: "請選擇車站",
  searchPlaceholderRoute: "站名或路線編號",
  swap: "對調起訖",
  langZh: "繁中",
  langEn: "English",
  incomplete: "請選擇起訖站",
  sameStation: "起點與終點不可相同",
  missingFare: "無法顯示該程車費",
  unknownStation: "找不到該車站",
  fareQuery: "車費查詢",
  language: "語言",
  journeyUnknown: "？",
  dataAsOf: "票價資料截至 {date}（港鐵成人八達通公開車費表）",
  // Day3
  addSecondLeg: "＋ 加入第二程",
  removeSecondLeg: "✕ 移除第二程",
  secondLegTitle: "第二程",
  swapLegs: "對調兩程",
  dragLegHandle: "拖曳以對調兩程順序",
  legMode: "乘車模式",
  modeMtr: "港鐵（MTR）",
  modeLightRail: "輕鐵（LR）",
  modeBusDisabled: "巴士／小巴（敬請期待）",
  interchangeAuto: "自動換乘：",
  earlyBird: "符合早晨折扣",
  earlyBirdNote:
    "星期一至五（公眾假期除外）07:15–08:15，以成人八達通於指定核心市區車站出閘，車費 75 折。",
  earlyBirdRef: "港鐵早晨折扣優惠（官方）",
  personalPercent: "個人優惠（%）",
  personalPercentNote: "非官方估算：依本人實際優惠輸入",
  fareBreakdown: "車費分項",
  officialSubtotal: "官方小計",
  interchangeDiscount: "官方轉乘減免",
  afterInterchange: "轉乘後金額",
  earlyBirdDiscount: "早晨折扣（25%）",
  afterEarlyBird: "早晨後金額",
  personalDiscount: "個人優惠減免",
  estimatedPayable: "估計應付",
  mtrLrFreeLabel: "港鐵↔輕鐵特惠轉乘",
  mtrLrFreeApplicable: "適用",
  mtrLrFreeNotApplicable: "不適用",
  mtrLrFreeNote:
    "使用同一張八達通，於指定車站轉乘；成人輕鐵車費 $5.4 或以下（小童／學生等 $2.6 或以下）可免費接駁。出閘／站後 30 分鐘內再入站／閘。本工具僅依輕鐵成人價是否 ≤ $5.4 估算。",
  mtrLrFreeRef: "港鐵輕鐵及巴士服務（官方）",
  officialLabel: "官方",
  personalLabel: "個人估算",
  homeNav: "車費查詢",
  fareSaverNav: "港鐵特惠站",
  fareSaverTitle: "港鐵特惠站（樣本列表）",
  fareSaverDisclaimer:
    "以下為示範用途。實際每程可享 -$2 優惠，須本人前往特惠站出口拍八達通方可獲得；本計算工具不自動扣減此優惠。",
  fareSaverStation: "特惠站",
  fareSaverLocation: "位置",
  mapTitle: "行程地圖",
} as const satisfies Record<MessageKey, string>;

const en: Record<MessageKey, string> = {
  brandEyebrow: "MTR fare",
  brandTitle: "HK Commute Fare",
  tagline: "MTR urban lines adult Octopus single journey",
  origin: "Origin",
  destination: "Destination",
  search: "search",
  byLine: "Pick by line",
  line: "line",
  pickStation: "station",
  clear: "Clear",
  noneSelected: "No station selected",
  selectedPrefix: "Selected: ",
  noMatch: "No matching stations",
  searchResults: "search results",
  selectLine: "Select line",
  selectStation: "Select station",
  searchPlaceholder: "Please select a station",
  searchPlaceholderRoute: "Station name or route number",
  swap: "Swap origin and destination",
  langZh: "繁中",
  langEn: "English",
  incomplete: "Select origin and destination",
  sameStation: "Origin and destination must differ",
  missingFare: "Fare unavailable for this journey",
  unknownStation: "Unknown station",
  fareQuery: "Fare lookup",
  language: "Language",
  journeyUnknown: "?",
  dataAsOf: "Fares as of {date} (MTR Adult Octopus published chart)",
  // Day3
  addSecondLeg: "+ Add second leg",
  removeSecondLeg: "✕ Remove second leg",
  secondLegTitle: "Second Leg",
  swapLegs: "Swap legs",
  dragLegHandle: "Drag to swap leg order",
  legMode: "Transport mode",
  modeMtr: "MTR",
  modeLightRail: "Light Rail (LR)",
  modeBusDisabled: "Bus / Minibus (coming soon)",
  interchangeAuto: "Auto interchange: ",
  earlyBird: "I qualify for early bird discount",
  earlyBirdNote:
    "Mon–Fri (except public holidays) 07:15–08:15, Adult Octopus exiting a designated core urban station: 25% off. This tool does not detect time or station; checking the box assumes you qualify.",
  earlyBirdRef: "MTR Early Bird Discount (official)",
  personalPercent: "Personal discount (%)",
  personalPercentNote: "Unofficial estimate: enter your actual discount",
  fareBreakdown: "Fare breakdown",
  officialSubtotal: "Official subtotal",
  interchangeDiscount: "Official interchange discount",
  afterInterchange: "After interchange",
  earlyBirdDiscount: "Early bird (25%)",
  afterEarlyBird: "After early bird",
  personalDiscount: "Personal discount",
  estimatedPayable: "Estimated payable",
  mtrLrFreeLabel: "MTR↔Light Rail free interchange",
  mtrLrFreeApplicable: "Applicable",
  mtrLrFreeNotApplicable: "Not applicable",
  mtrLrFreeNote:
    "Same Octopus at designated stations. Free connection if adult Light Rail fare is $5.4 or below ($2.6 or below for child/student). Re-enter within 30 minutes after exit. This tool only checks adult LR fare ≤ $5.4.",
  mtrLrFreeRef: "MTR Light Rail & Bus services (official)",
  officialLabel: "Official",
  personalLabel: "Personal estimate",
  homeNav: "Fare Query",
  fareSaverNav: "Fare Saver Stations",
  fareSaverTitle: "MTR Fare Saver Stations (sample list)",
  fareSaverDisclaimer:
    "The following is for illustration only. The actual $2 saving requires tapping your Octopus at a designated Fare Saver machine at the station exit; it is NOT automatically deducted in this calculator.",
  fareSaverStation: "Fare Saver Station",
  fareSaverLocation: "Location",
  mapTitle: "Journey Map",
};

export const messages: Record<Locale, Record<MessageKey, string>> = {
  zh,
  en,
};

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}

export function stationPrimaryName(
  station: { nameZh: string; nameEn: string },
  locale: Locale,
): string {
  return locale === "en" ? station.nameEn : station.nameZh;
}

export function stationSecondaryName(
  station: { nameZh: string; nameEn: string },
  locale: Locale,
): string {
  return locale === "en" ? station.nameZh : station.nameEn;
}
