import { describe, expect, it } from "vitest";
import { applyPersonalPercent } from "./applyPersonalPercent";

describe("applyPersonalPercent", () => {
  it("10% off 100 → 90", () => {
    expect(applyPersonalPercent(100, 10)).toBe(90);
  });

  it("percent === 0 leaves amount unchanged", () => {
    expect(applyPersonalPercent(15, 0)).toBe(15);
  });

  it("applies percent to fractional amounts", () => {
    expect(applyPersonalPercent(7.5, 10)).toBe(6.75);
  });

  it("100% off → 0", () => {
    expect(applyPersonalPercent(42, 100)).toBe(0);
  });

  it("rejects percent below 0", () => {
    expect(() => applyPersonalPercent(100, -1)).toThrow(/percent/i);
  });

  it("rejects percent above 100", () => {
    expect(() => applyPersonalPercent(100, 101)).toThrow(/percent/i);
  });

  it("rejects non-finite percent", () => {
    expect(() => applyPersonalPercent(100, Number.NaN)).toThrow(/percent/i);
  });
});
