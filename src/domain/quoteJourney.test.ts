import { describe, expect, it } from "vitest";
import { quoteJourney } from "./quoteJourney";
import type { QuoteJourneyInput } from "./journeyTypes";

function input(
  partial: Partial<QuoteJourneyInput> & Pick<QuoteJourneyInput, "legAmounts">,
): QuoteJourneyInput {
  return {
    officialInterchangeDiscount: 0,
    earlyBirdApplied: false,
    personalPercent: 0,
    ...partial,
  };
}

describe("quoteJourney", () => {
  it("sums two legs with no discounts", () => {
    const result = quoteJourney(input({ legAmounts: [10, 5] }));
    expect(result).toEqual({
      ok: true,
      officialSubtotal: 15,
      officialInterchangeDiscount: 0,
      afterInterchange: 15,
      earlyBirdDiscount: 0,
      afterEarlyBird: 15,
      personalDiscount: 0,
      estimatedPayable: 15,
    });
  });

  it("subtracts official interchange discount", () => {
    const result = quoteJourney(
      input({ legAmounts: [10, 5], officialInterchangeDiscount: 5 }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.afterInterchange).toBe(10);
    expect(result.estimatedPayable).toBe(10);
  });

  it("applies early bird 75% after interchange", () => {
    const result = quoteJourney(
      input({
        legAmounts: [10, 5],
        officialInterchangeDiscount: 5,
        earlyBirdApplied: true,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.afterInterchange).toBe(10);
    expect(result.earlyBirdDiscount).toBe(2.5);
    expect(result.afterEarlyBird).toBe(7.5);
    expect(result.estimatedPayable).toBe(7.5);
  });

  it("stacks early bird then personal percent", () => {
    const result = quoteJourney(
      input({
        legAmounts: [10, 5],
        officialInterchangeDiscount: 5,
        earlyBirdApplied: true,
        personalPercent: 10,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.afterEarlyBird).toBe(7.5);
    expect(result.personalDiscount).toBeCloseTo(0.75);
    expect(result.estimatedPayable).toBeCloseTo(6.75);
  });

  it("returns error for illegal personal percent", () => {
    const result = quoteJourney(
      input({ legAmounts: [10], personalPercent: -5 }),
    );
    expect(result).toEqual({
      ok: false,
      error: {
        code: "invalid_personal_percent",
        message: expect.stringMatching(/percent/i),
      },
    });
  });

  it("clamps interchange when discount exceeds subtotal", () => {
    const result = quoteJourney(
      input({
        legAmounts: [10, 5],
        officialInterchangeDiscount: 20,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.officialInterchangeDiscount).toBe(15);
    expect(result.afterInterchange).toBe(0);
    expect(result.estimatedPayable).toBe(0);
  });

  it("rejects empty legs", () => {
    const result = quoteJourney(input({ legAmounts: [] }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("empty_legs");
  });

  it("rejects negative leg amounts", () => {
    const result = quoteJourney(input({ legAmounts: [10, -1] }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("invalid_leg_amount");
  });
});
