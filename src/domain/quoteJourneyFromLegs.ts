import type { FareMatrix } from "./lookupFare";
import { lookupFare } from "./lookupFare";
import { lookupLightRailFare } from "./lookupLightRailFare";
import { mtrLrFreeDiscount } from "./mtrLrFree";
import { quoteJourney } from "./quoteJourney";
import type {
  JourneyLeg,
  JourneyQuote,
  TransportMode,
} from "./journeyTypes";

export type QuoteJourneyFromLegsInput = {
  legs: JourneyLeg[];
  mtrMatrix: FareMatrix;
  lightRailMatrix: FareMatrix;
  earlyBirdApplied: boolean;
  personalPercent: number;
  /** Override official interchange; default = mtr_lr_free rule */
  officialInterchangeDiscount?: number;
};

export type QuoteJourneyFromLegsResult =
  | {
      ok: true;
      quote: Extract<JourneyQuote, { ok: true }>;
      legAmounts: number[];
      mtrLrFree: ReturnType<typeof mtrLrFreeDiscount>;
    }
  | {
      ok: false;
      error: { code: string; message: string };
      quote?: Extract<JourneyQuote, { ok: false }>;
    };

function lookupByMode(
  mode: TransportMode,
  fromId: string,
  toId: string,
  mtrMatrix: FareMatrix,
  lightRailMatrix: FareMatrix,
) {
  return mode === "light_rail"
    ? lookupLightRailFare(fromId, toId, lightRailMatrix)
    : lookupFare(fromId, toId, mtrMatrix);
}

/**
 * Day2：查每程票價 → mtr_lr_free → quoteJourney。
 */
export function quoteJourneyFromLegs(
  input: QuoteJourneyFromLegsInput,
): QuoteJourneyFromLegsResult {
  const { legs, mtrMatrix, lightRailMatrix, earlyBirdApplied, personalPercent } =
    input;

  if (legs.length === 0) {
    return {
      ok: false,
      error: { code: "empty_legs", message: "At least one leg required" },
    };
  }

  const legAmounts: number[] = [];
  const priced = [];

  for (const leg of legs) {
    const fare = lookupByMode(
      leg.mode,
      leg.fromId,
      leg.toId,
      mtrMatrix,
      lightRailMatrix,
    );
    if (!fare.ok) {
      return {
        ok: false,
        error: {
          code: fare.error.code,
          message: fare.error.message,
        },
      };
    }
    legAmounts.push(fare.amount);
    priced.push({ mode: leg.mode, amount: fare.amount });
  }

  const mtrLrFree = mtrLrFreeDiscount(priced);
  const officialInterchangeDiscount =
    input.officialInterchangeDiscount ?? mtrLrFree.discount;

  const quote = quoteJourney({
    legAmounts,
    officialInterchangeDiscount,
    earlyBirdApplied,
    personalPercent,
  });

  if (!quote.ok) {
    return { ok: false, error: quote.error, quote };
  }

  return { ok: true, quote, legAmounts, mtrLrFree };
}
