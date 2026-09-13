import { test, expect } from '@playwright/test'
import { gotoApp, pickBySearch, expectStatus, expectBreakdownFare } from './helpers'

/**
 * Smoke: critical path (home → two stations → fare; same-station error).
 * Day-to-day / PR: pnpm e2e:smoke
 */
test.describe('smoke', () => {
  test('home shows brand and incomplete guide', async ({ page }) => {
    await gotoApp(page)
    await expectStatus(page, '請選擇起訖站')
  })

  test('select two stations and see fare', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectBreakdownFare(page, /HK\$13\.2/)
  })

  test('same station shows error without HK$0', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '旺', /旺角/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectStatus(page, '起點與終點不可相同')
    await expect(page.getByRole('status')).not.toContainText('HK$0')
  })

  // ── Day5: second leg + early bird smoke ──────────────────────────────────

  test('nav shows home and fare-saver links', async ({ page }) => {
    await gotoApp(page)
    await expect(page.getByRole('link', { name: '車費查詢' })).toBeVisible()
    await expect(page.getByRole('link', { name: '港鐵特惠站' })).toBeVisible()
  })

  test('navigate to fare-saver page shows disclaimer', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('link', { name: '港鐵特惠站' }).click()
    await expect(page.getByRole('heading', { name: /特惠站/ })).toBeVisible()
    await expect(page.getByRole('note')).toContainText('不自動扣減')
  })

  test('mode selector has Bus option disabled', async ({ page }) => {
    await gotoApp(page)
    const busBtn = page.getByRole('button', { name: /巴士／小巴/ }).first()
    await expect(busBtn).toBeDisabled()
  })

  test('add second leg shows second leg section', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: /加入第二程/ }).click()
    await expect(page.getByRole('region', { name: '第二程' })).toBeVisible()
    await expect(page.getByRole('button', { name: /移除第二程/ })).toBeVisible()
  })

  test('early bird checkbox appears after picking two stations', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expect(page.getByRole('checkbox', { name: /早晨折扣/ })).toBeVisible()
  })

  test('checking early bird shows earlyBirdDiscount in breakdown', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)

    // Before early bird: no earlyBirdDiscount row
    const breakdown = page.getByRole('region', { name: '車費分項' })
    await expect(breakdown.getByText(/早晨折扣/)).not.toBeVisible()

    // Check early bird
    await page.getByRole('checkbox', { name: /早晨折扣/ }).check()

    // After: earlyBirdDiscount row is visible
    await expect(breakdown.getByText(/早晨折扣/)).toBeVisible()
    await expect(breakdown.getByText(/估計應付/)).toBeVisible()
  })
})
