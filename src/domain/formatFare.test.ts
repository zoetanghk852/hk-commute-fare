import { describe, expect, it } from "vitest";
import { formatFare } from "./formatFare";

describe("formatFare", () => {
  it("formats 12.5 as HK$12.5", () => {
    expect(formatFare(12.5)).toBe("HK$12.5");
  });

  it("formats 0.1 as HK$0.1", () => {
    expect(formatFare(0.1)).toBe("HK$0.1");
  });

  it("formats arithmetic result without floating-point artifacts (0.1 + 0.2 → HK$0.3)", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754; must display as HK$0.3
    expect(formatFare(0.1 + 0.2)).toBe("HK$0.3");
  });

  it("formats 12 as HK$12", () => {
    expect(formatFare(12)).toBe("HK$12");
  });
});
