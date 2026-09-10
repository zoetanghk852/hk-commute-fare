import { describe, expect, it } from "vitest";
import { formatFare } from "./formatFare";

describe("formatFare", () => {
  it("formats 12.5 as HK$12.5", () => {
    expect(formatFare(12.5)).toBe("HK$12.5");
  });

  it("formats 12.50 as HK$12.5", () => {
    expect(formatFare(0.1)).toBe("HK$0.1");
  });

  it("formats 12 as HK$12", () => {
    expect(formatFare(12)).toBe("HK$12");
  });
});
