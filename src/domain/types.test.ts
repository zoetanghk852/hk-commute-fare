import { describe, expect, it } from "vitest";
import type { FareResult } from "./types";

function getAmount(result: FareResult): number | undefined {
  return result.ok ? result.amount : undefined;
}

describe("FareResult", () => {
  it("success has amount", () => {
    const result: FareResult = { ok: true, amount: 12.5 };
    expect(getAmount(result)).toBe(12.5);
  });

  it("failure has no amount", () => {
    const result: FareResult = {
      ok: false,
      error: { code: "same_station", message: "起訖站不可相同" },
    };
    expect(getAmount(result)).toBeUndefined();
    expect("amount" in result).toBe(false);
  });
});
