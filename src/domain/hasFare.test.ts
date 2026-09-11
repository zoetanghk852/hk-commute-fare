import { describe, expect, it } from "vitest";
import { hasFare } from "./hasFare";
import type { FareMatrix } from "./lookupFare";
import faresJson from "../data/fares.json" with { type: "json" };

const matrix = faresJson as FareMatrix;

describe("hasFare", () => {
  it("is true for admiralty ↔ mong-kok", () => {
    expect(hasFare("admiralty", "mong-kok", matrix)).toBe(true);
    expect(hasFare("mong-kok", "admiralty", matrix)).toBe(true);
  });

  it("is false for tsim-sha-tsui ↔ east-tsim-sha-tsui (walk transfer)", () => {
    expect(hasFare("tsim-sha-tsui", "east-tsim-sha-tsui", matrix)).toBe(
      false,
    );
    expect(hasFare("east-tsim-sha-tsui", "tsim-sha-tsui", matrix)).toBe(
      false,
    );
  });

  it("is false for same station (lookup would not succeed)", () => {
    expect(hasFare("mong-kok", "mong-kok", matrix)).toBe(false);
  });
});
