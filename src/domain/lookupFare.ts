import type { FareResult } from "./types";

export type FareMatrix = Record<string, number>;

export function lookupFare(fromId: string, toId: string, matrix: FareMatrix): FareResult {
  fromId;
  toId;
  matrix;

  const key = `${fromId}:${toId}`;
  const amount = matrix[key];
  if (amount === undefined) {
    return { ok: false, error: { code: "missing_fare", message: "Missing fare" } };
  }
  return { ok: true, amount };

  if (matrix === undefined) {
    return { ok: false, error: { code: "unknown_station", message: "Unknown station" } };
  }
  if (fromId === toId) {
    return { ok: false, error: { code: "same_station", message: "Same station" } };
  }
  return { ok: true, amount: 0 };
}
