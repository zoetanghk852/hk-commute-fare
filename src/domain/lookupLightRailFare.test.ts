import { describe, expect, it } from "vitest";
import { lookupLightRailFare } from "./lookupLightRailFare";
import type { FareMatrix } from "./lookupFare";

const matrix: FareMatrix = {
  "lr-tuen-mun:lr-town-centre": 5.1,
  "lr-tuen-mun:lr-yuen-long": 6.1,
};

describe("lookupLightRailFare", () => {
  it("returns amount when OD exists", () => {
    expect(lookupLightRailFare("lr-tuen-mun", "lr-town-centre", matrix)).toEqual({
      ok: true,
      amount: 5.1,
    });
  });

  it("returns same_station when from === to", () => {
    const result = lookupLightRailFare("lr-tuen-mun", "lr-tuen-mun", matrix);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("same_station");
  });

  it("looks up reverse key", () => {
    expect(lookupLightRailFare("lr-town-centre", "lr-tuen-mun", matrix)).toEqual({
      ok: true,
      amount: 5.1,
    });
  });

  it("returns missing_fare when OD absent", () => {
    const result = lookupLightRailFare("lr-tuen-mun", "lr-unknown", matrix);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("missing_fare");
  });
});
