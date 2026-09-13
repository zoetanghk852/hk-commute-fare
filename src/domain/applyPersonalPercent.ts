/**
 * 對「已扣官方轉乘／早晨折扣後的金額」套用個人折扣％（信用卡等）。
 * 定案：估計應付 = amountAfterOfficial × (1 - percent/100)
 */
export function applyPersonalPercent(
  amountAfterOfficial: number,
  percent: number,
): number {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError(
      `personal percent must be finite and in 0–100, got ${percent}`,
    );
  }
  return amountAfterOfficial * (1 - percent / 100);
}
