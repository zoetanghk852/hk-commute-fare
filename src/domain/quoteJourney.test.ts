import { describe, it } from "vitest";
// 任務 B 改成真正的 it 時，加上 expect 與 quoteJourney／型別 import

describe("quoteJourney", () => {
  it.todo("sums two legs with no discounts");

  // 建議案例（寫進真正的 it）：
  // - 兩程 + officialInterchangeDiscount
  // - 再套 personalPercent
  // - 一程金額無效時的行為（若你設計為先傳 number[]，可測「空陣列」或負數）
  // - 非法 personalPercent
})
