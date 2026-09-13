/**
 * V2a Day1：行程報價相關型別。
 * 分項：官方小計、官方轉乘、早晨折扣、個人％、估計應付。
 */

export type TransportMode = "mtr" | "light_rail";

/** Day2 才會認真用 mode；Day1 可先只當標籤 */
export type JourneyLeg = {
  mode: TransportMode;
  fromId: string;
  toId: string;
};

export type JourneyQuoteErrorCode =
  | "invalid_personal_percent"
  | "invalid_leg_amount"
  | "invalid_interchange_discount"
  | "empty_legs";

export type JourneyQuoteError = {
  code: JourneyQuoteErrorCode;
  message: string;
};

/** 成功分項；earlyBirdDiscount = 套用 75 折前後的差額（未套用則 0） */
export type JourneyQuoteSuccess = {
  ok: true;
  officialSubtotal: number;
  officialInterchangeDiscount: number;
  /** 扣轉乘後金額 */
  afterInterchange: number;
  /** 早晨折扣減免額（未勾選為 0） */
  earlyBirdDiscount: number;
  /** 扣早晨後、套個人％前 */
  afterEarlyBird: number;
  /** 個人％減免額 */
  personalDiscount: number;
  estimatedPayable: number;
};

export type JourneyQuoteFailure = {
  ok: false;
  error: JourneyQuoteError;
};

export type JourneyQuote = JourneyQuoteSuccess | JourneyQuoteFailure;

export type QuoteJourneyInput = {
  /** Day1：先用「已查好的每程金額」簡化；Day2 再接 lookup* */
  legAmounts: number[];
  /** 官方轉乘減免金額；無則 0。Day2 再接 mtr_lr_free */
  officialInterchangeDiscount: number;
  /**
   * 早晨折扣（早鳥）：使用者聲明符合條件時為 true。
   * @see https://www.mtr.com.hk/ch/customer/main/early_bird.html
   */
  earlyBirdApplied: boolean;
  /** 0–100；非法要錯誤，不可猜 */
  personalPercent: number;
};
