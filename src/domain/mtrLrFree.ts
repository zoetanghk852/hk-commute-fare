import type { TransportMode } from "./journeyTypes";

/** Adult Octopus Light Rail fare ceiling for free MTR↔LR interchange. */
export const MTR_LR_FREE_ADULT_MAX = 5.4;

export type PricedLeg = {
  mode: TransportMode;
  amount: number;
};

export type MtrLrFreeResult = {
  /** Amount to pass as officialInterchangeDiscount */
  discount: number;
  /** false when mixed modes but LR adult fare > $5.4 (or no LR leg) */
  applicable: boolean;
  reason?: "not_mixed_modes" | "lr_fare_above_threshold" | "no_light_rail_leg";
};

/**
 * Official mtr_lr_free: when journey mixes MTR + Light Rail and the Light Rail
 * adult Octopus fare is ≤ $5.4, discount equals that Light Rail leg amount.
 * Otherwise no discount (caller may show「不適用」).
 */
export function mtrLrFreeDiscount(legs: PricedLeg[]): MtrLrFreeResult {
  const modes = new Set(legs.map((l) => l.mode));
  const hasMtr = modes.has("mtr");
  const lrLegs = legs.filter((l) => l.mode === "light_rail");

  if (!hasMtr || lrLegs.length === 0) {
    return {
      discount: 0,
      applicable: false,
      reason: !hasMtr && lrLegs.length === 0 ? "not_mixed_modes" : lrLegs.length === 0 ? "no_light_rail_leg" : "not_mixed_modes",
    };
  }

  if (!hasMtr || !modes.has("light_rail")) {
    return { discount: 0, applicable: false, reason: "not_mixed_modes" };
  }

  // V2a: at most one LR leg in a two-leg journey; sum if multiple
  const lrAmount = lrLegs.reduce((sum, l) => sum + l.amount, 0);
  if (lrAmount > MTR_LR_FREE_ADULT_MAX) {
    return {
      discount: 0,
      applicable: false,
      reason: "lr_fare_above_threshold",
    };
  }

  return { discount: lrAmount, applicable: true };
}
