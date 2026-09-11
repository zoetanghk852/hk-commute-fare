import { test, expect } from '@playwright/test'
import { gotoApp, pickBySearch, expectStatus } from './helpers'

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
    await pickBySearch(page, '起點', 'adm', /金鐘|Admiralty/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectStatus(page, /HK\$13\.2/)
  })

  test('same station shows error without HK$0', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '旺', /旺角/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectStatus(page, '起點與終點不可相同')
    await expect(page.getByRole('status')).not.toContainText('HK$0')
  })
})
