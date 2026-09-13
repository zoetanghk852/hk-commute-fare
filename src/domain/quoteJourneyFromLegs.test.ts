import { describe, expect, it } from "vitest";
import { quoteJourneyFromLegs } from "./quoteJourneyFromLegs";
import type { FareMatrix } from "./lookupFare";

const mtrMatrix: FareMatrix = {
  "admiralty:tuen-mun": 27.4,
  "tuen-mun:admiralty": 27.4,
};

const lightRailMatrix: FareMatrix = {
  "lr-tuen-mun:lr-town-centre": 5.1,
  "lr-tuen-mun:lr-yuen-long": 6.1,
};

describe("quoteJourneyFromLegs", () => {
  it("looks up fares and applies mtr_lr_free when LR ≤ $5.4", () => {
    const result = quoteJourneyFromLegs({
      legs: [
        { mode: "mtr", fromId: "admiralty", toId: "tuen-mun" },
        { mode: "light_rail", fromId: "lr-tuen-mun", toId: "lr-town-centre" },
      ],
      mtrMatrix,
      lightRailMatrix,
      earlyBirdApplied: false,
      personalPercent: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.legAmounts).toEqual([27.4, 5.1]);
    expect(result.mtrLrFree.applicable).toBe(true);
    expect(result.quote.officialInterchangeDiscount).toBe(5.1);
    expect(result.quote.estimatedPayable).toBeCloseTo(27.4);
  });

  it("does not discount when LR fare > $5.4", () => {
    const result = quoteJourneyFromLegs({
      legs: [
        { mode: "mtr", fromId: "admiralty", toId: "tuen-mun" },
        { mode: "light_rail", fromId: "lr-tuen-mun", toId: "lr-yuen-long" },
      ],
      mtrMatrix,
      lightRailMatrix,
      earlyBirdApplied: false,
      personalPercent: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mtrLrFree.applicable).toBe(false);
    expect(result.quote.officialInterchangeDiscount).toBe(0);
    expect(result.quote.estimatedPayable).toBeCloseTo(33.5);
  });

  it("propagates missing fare", () => {
    const result = quoteJourneyFromLegs({
      legs: [{ mode: "mtr", fromId: "admiralty", toId: "nowhere" }],
      mtrMatrix,
      lightRailMatrix,
      earlyBirdApplied: false,
      personalPercent: 0,
    });
    expect(result.ok).toBe(false);
  });
});
