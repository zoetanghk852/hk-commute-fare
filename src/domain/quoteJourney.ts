import type { JourneyQuote, QuoteJourneyInput } from "./journeyTypes";

/**
 * 組合官方小計、官方轉乘、個人％ → 分項報價。
 * 定案順序：先加總 legAmounts → 減 officialInterchangeDiscount → 再套個人％。
 * Day1：用 TDD 實作；不要在這裡呼叫 lookupFare（Day2）。
 */
export function quoteJourney(_input: QuoteJourneyInput): JourneyQuote {
  throw new Error("Not implemented");
}
