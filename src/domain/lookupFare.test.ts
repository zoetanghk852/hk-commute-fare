import { describe, expect, it } from "vitest";
import { lookupFare, type FareMatrix } from "./lookupFare";
import type { FareErrorCode, FareResult } from "./types";

function getAmount(result: FareResult): number | undefined {
  return result.ok ? result.amount : undefined;
}

type ExpectedSuccess = { ok: true; amount: number };
type ExpectedFailure = { ok: false; code: FareErrorCode };
type Expected = ExpectedSuccess | ExpectedFailure;

describe("lookupFare", () => {
  it("returns amount when OD exists", () => {
    const matrix: FareMatrix = { "admiralty:mong-kok": 9.2 };
    const result = lookupFare("admiralty", "mong-kok", matrix);
    expect(result).toEqual({ ok: true, amount: 9.2 });
    expect(getAmount(result)).toBe(9.2);
  });

  it("returns same_station error when from and to are same", () => {
    const result = lookupFare("mong-kok", "mong-kok", {});
    expect(result).toEqual({
      ok: false,
      error: { code: "same_station", message: "Same station" },
    });
  });

  it("returns amount using reverse key when forward missing", () => {
    const matrix: FareMatrix = { "mong-kok:tsing-yi": 13.2 };
    const result = lookupFare("tsing-yi", "mong-kok", matrix);
    expect(result).toEqual({ ok: true, amount: 13.2 });
  });

  it("returns missing_fare when OD not in matrix", () => {
    const matrix: FareMatrix = { "admiralty:mong-kok": 9.2 };
    const result = lookupFare("wan-chai", "kwun-tong", matrix);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("missing_fare");
  });

  /**
   * 任務 D：表格驅動（table-driven）
   * 一張表列出正向／負向契約，面試時可直接講「測了哪些邊界」。
   */
  describe("table-driven cases", () => {
    const sharedMatrix: FareMatrix = {
      "admiralty:mong-kok": 9.2,
      "central:causeway-bay": 5.9,
      "hong-kong:tsing-yi": 12.5,
      "mong-kok:tsing-yi": 13.2,
    };

    it.each([
      {
        name: "forward: admiralty → mong-kok",
        from: "admiralty",
        to: "mong-kok",
        matrix: sharedMatrix,
        expected: { ok: true, amount: 9.2 } satisfies Expected,
      },
      {
        name: "forward: central → causeway-bay",
        from: "central",
        to: "causeway-bay",
        matrix: sharedMatrix,
        expected: { ok: true, amount: 5.9 } satisfies Expected,
      },
      {
        name: "forward: hong-kong → tsing-yi",
        from: "hong-kong",
        to: "tsing-yi",
        matrix: sharedMatrix,
        expected: { ok: true, amount: 12.5 } satisfies Expected,
      },
      {
        name: "reverse: tsing-yi → mong-kok (only reverse key)",
        from: "tsing-yi",
        to: "mong-kok",
        matrix: sharedMatrix,
        expected: { ok: true, amount: 13.2 } satisfies Expected,
      },
      {
        name: "reverse: causeway-bay → central",
        from: "causeway-bay",
        to: "central",
        matrix: sharedMatrix,
        expected: { ok: true, amount: 5.9 } satisfies Expected,
      },
      {
        name: "same station: mong-kok",
        from: "mong-kok",
        to: "mong-kok",
        matrix: sharedMatrix,
        expected: { ok: false, code: "same_station" } satisfies Expected,
      },
      {
        name: "same station: admiralty",
        from: "admiralty",
        to: "admiralty",
        matrix: {},
        expected: { ok: false, code: "same_station" } satisfies Expected,
      },
      {
        name: "missing_fare: wan-chai → kwun-tong",
        from: "wan-chai",
        to: "kwun-tong",
        matrix: sharedMatrix,
        expected: { ok: false, code: "missing_fare" } satisfies Expected,
      },
      {
        name: "missing_fare: empty matrix",
        from: "admiralty",
        to: "mong-kok",
        matrix: {},
        expected: { ok: false, code: "missing_fare" } satisfies Expected,
      },
      {
        name: "missing_fare: both directions absent",
        from: "olympic",
        to: "kwun-tong",
        matrix: sharedMatrix,
        expected: { ok: false, code: "missing_fare" } satisfies Expected,
      },
    ])("$name", ({ from, to, matrix, expected }) => {
      const result = lookupFare(from, to, matrix);

      if (expected.ok) {
        expect(result).toEqual({ ok: true, amount: expected.amount });
        expect(getAmount(result)).toBe(expected.amount);
      } else {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(expected.code);
        }
        expect(getAmount(result)).toBeUndefined();
      }
    });
  });
});
