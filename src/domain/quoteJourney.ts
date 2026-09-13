import { applyPersonalPercent } from "./applyPersonalPercent";
import type { JourneyQuote, QuoteJourneyInput } from "./journeyTypes";

/**
 * 組合官方小計、官方轉乘、早晨折扣（75折）、個人％ → 分項報價。
 *
 * 定案順序：
 * 1. 加總 legAmounts → officialSubtotal
 * 2. 減 officialInterchangeDiscount → afterInterchange（折扣超過小計則 clamp）
 * 3. 若 earlyBirdApplied：afterEarlyBird = afterInterchange × 0.75
 * 4. estimatedPayable = applyPersonalPercent(afterEarlyBird, personalPercent)
 */
export function quoteJourney(input: QuoteJourneyInput): JourneyQuote {
  const {
    legAmounts,
    officialInterchangeDiscount,
    earlyBirdApplied,
    personalPercent,
  } = input;

  if (legAmounts.length === 0) {
    return {
      ok: false,
      error: { code: "empty_legs", message: "At least one leg amount required" },
    };
  }

  for (const amount of legAmounts) {
    if (!Number.isFinite(amount) || amount < 0) {
      return {
        ok: false,
        error: {
          code: "invalid_leg_amount",
          message: `Leg amounts must be finite and ≥ 0, got ${amount}`,
        },
      };
    }
  }

  if (
    !Number.isFinite(officialInterchangeDiscount) ||
    officialInterchangeDiscount < 0
  ) {
    return {
      ok: false,
      error: {
        code: "invalid_interchange_discount",
        message: `Interchange discount must be finite and ≥ 0, got ${officialInterchangeDiscount}`,
      },
    };
  }

  if (
    !Number.isFinite(personalPercent) ||
    personalPercent < 0 ||
    personalPercent > 100
  ) {
    return {
      ok: false,
      error: {
        code: "invalid_personal_percent",
        message: `personal percent must be finite and in 0–100, got ${personalPercent}`,
      },
    };
  }

  const officialSubtotal = legAmounts.reduce((sum, n) => sum + n, 0);
  const appliedInterchange = Math.min(
    officialInterchangeDiscount,
    officialSubtotal,
  );
  const afterInterchange = officialSubtotal - appliedInterchange;
  const afterEarlyBird = earlyBirdApplied
    ? afterInterchange * 0.75
    : afterInterchange;
  const earlyBirdDiscount = afterInterchange - afterEarlyBird;

  let estimatedPayable: number;
  try {
    estimatedPayable = applyPersonalPercent(afterEarlyBird, personalPercent);
  } catch {
    return {
      ok: false,
      error: {
        code: "invalid_personal_percent",
        message: `personal percent must be finite and in 0–100, got ${personalPercent}`,
      },
    };
  }

  const personalDiscount = afterEarlyBird - estimatedPayable;

  return {
    ok: true,
    officialSubtotal,
    officialInterchangeDiscount: appliedInterchange,
    afterInterchange,
    earlyBirdDiscount,
    afterEarlyBird,
    personalDiscount,
    estimatedPayable,
  };
}
