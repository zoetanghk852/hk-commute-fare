/**
 * 對「已扣官方轉乘後的金額」套用個人折扣％（信用卡等）。
 * 定案：估計應付 = amountAfterOfficial × (1 - percent/100)
 * Day1：用 TDD 實作（先改測試，再改這裡）
 */
export function applyPersonalPercent(_amountAfterOfficial: number, _percent: number): number {
  throw new Error("Not implemented");
}
