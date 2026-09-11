import type { FareResult } from "./types";

export type FareMatrix = Record<string, number>;

export function lookupFare(fromId: string, toId: string, matrix: FareMatrix): FareResult {
  if (fromId === toId) {
    return { ok: false, error: { code: "same_station", message: "Same station" } };
  }

  const forward = matrix[`${fromId}:${toId}`];
  if (forward !== undefined) {
    return { ok: true, amount: forward };
  }

  const reverse = matrix[`${toId}:${fromId}`];
  if (reverse !== undefined) {
    return { ok: true, amount: reverse };
  }

  return { ok: false, error: { code: "missing_fare", message: "Missing fare" } };
}
