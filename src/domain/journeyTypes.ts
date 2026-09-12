/**
 * V2a Day1：行程報價相關型別（你來補完整；拿掉 never／TODO）。
 * 官方小計、官方轉乘、個人％減免、估計應付要能分項。
 */

export type TransportMode = "mtr" | "light_rail";

/** Day2 才會認真用 mode；Day1 可先只當標籤 */
export type JourneyLeg = {
  mode: TransportMode;
  fromId: string;
  toId: string;
};

/**
 * 建議 discriminated union，例如：
 * { ok: true; ...breakdown } | { ok: false; error: ... }
 */
export type JourneyQuote = never;

export type QuoteJourneyInput = {
  /** Day1：先用「已查好的每程金額」簡化；Day2 再接 lookup* */
  legAmounts: number[];
  /** 官方轉乘減免金額；無則 0。Day2 再接 mtr_lr_free */
  officialInterchangeDiscount: number;
  /** 0–100；非法要錯誤，不可猜 */
  personalPercent: number;
};
