export type FareErrorCode = "same_station" | "missing_fare" | "unknown_station";

export type FareError = {
  code: FareErrorCode;
  message: string;
};

export type FareResult = { ok: true; amount: number } | { ok: false; error: FareError };
