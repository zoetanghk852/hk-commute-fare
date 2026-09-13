import { describe, expect, it } from "vitest";
import { mtrLrFreeDiscount } from "./mtrLrFree";

describe("mtrLrFreeDiscount", () => {
  it("applies full LR amount when adult fare ≤ $5.4 on mixed MTR+LR", () => {
    expect(
      mtrLrFreeDiscount([
        { mode: "mtr", amount: 13.2 },
        { mode: "light_rail", amount: 5.4 },
      ]),
    ).toEqual({ discount: 5.4, applicable: true });
  });

  it("applies when LR fare is below threshold", () => {
    expect(
      mtrLrFreeDiscount([
        { mode: "light_rail", amount: 5.1 },
        { mode: "mtr", amount: 9.2 },
      ]),
    ).toEqual({ discount: 5.1, applicable: true });
  });

  it("does not apply when LR adult fare > $5.4", () => {
    expect(
      mtrLrFreeDiscount([
        { mode: "mtr", amount: 10 },
        { mode: "light_rail", amount: 6.1 },
      ]),
    ).toEqual({
      discount: 0,
      applicable: false,
      reason: "lr_fare_above_threshold",
    });
  });

  it("does not apply for MTR-only", () => {
    expect(
      mtrLrFreeDiscount([
        { mode: "mtr", amount: 10 },
        { mode: "mtr", amount: 5 },
      ]),
    ).toMatchObject({ discount: 0, applicable: false });
  });

  it("does not apply for LR-only", () => {
    expect(
      mtrLrFreeDiscount([{ mode: "light_rail", amount: 5.1 }]),
    ).toMatchObject({ discount: 0, applicable: false });
  });
});
