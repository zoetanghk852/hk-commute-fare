import { describe, expect, it } from "vitest";
import { lookupFare, type FareMatrix } from "./lookupFare";
import type { FareResult } from "./types";

function getAmount(result: FareResult): number | undefined {
  return result.ok ? result.amount : undefined;
}

describe("lookupFare", () => {
  it("returns amount when OD exists", () => {
    const matrix: FareMatrix = { "admiralty:mong-kok": 9.2 };
    const result = lookupFare("admiralty", "mong-kok", matrix);
    expect(result).toEqual({ ok: true, amount: 9.2 });
    expect(getAmount(result)).toBe(9.2);
  });
  //   it("return same station error", () => {});
  //   it("missing_fare", () => {});
});
