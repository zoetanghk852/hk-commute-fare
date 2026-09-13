import type { FareMatrix } from "./lookupFare";
import { lookupFare } from "./lookupFare";
import type { FareResult } from "./types";

/** Same FareResult contract as heavy-rail lookupFare. */
export function lookupLightRailFare(
  fromId: string,
  toId: string,
  matrix: FareMatrix,
): FareResult {
  return lookupFare(fromId, toId, matrix);
}
