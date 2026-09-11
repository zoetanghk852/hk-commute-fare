import { lookupFare, type FareMatrix } from "./lookupFare";

/** True iff `lookupFare` would succeed for this OD pair. */
export function hasFare(
  fromId: string,
  toId: string,
  matrix: FareMatrix,
): boolean {
  return lookupFare(fromId, toId, matrix).ok;
}
