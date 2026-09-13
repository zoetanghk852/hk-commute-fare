import { test, expect } from '@playwright/test'
import { gotoApp, pickBySearch, expectStatus, expectBreakdownFare } from './helpers'

test.describe('acceptance', () => {
  test('zh search for 旺 selects Mong Kok', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '旺', /旺角/)
    await expect(page.getByLabel('起點搜尋')).toHaveValue('旺角')
    await expect(page.getByText(/已選：旺角/)).toBeVisible()
  })

  test('en search for adm selects Admiralty', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: 'English' }).click()
    await pickBySearch(page, 'Origin', 'adm', /Admiralty/)
    await expect(page.getByText(/Selected:\s*Admiralty/)).toBeVisible()
  })

  test('both stations selected shows HK$', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectBreakdownFare(page, /HK\$/)
  })

  test('swap keeps fare amount', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectBreakdownFare(page, /HK\$13\.2/)
    await page.getByRole('button', { name: '對調起訖' }).click()
    await expect(page.getByLabel('起點搜尋')).toHaveValue('旺角')
    await expect(page.getByLabel('終點搜尋')).toHaveValue('金鐘')
    await expectBreakdownFare(page, /HK\$13\.2/)
  })

  test('same station shows error without HK$0', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '旺', /旺角/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectStatus(page, '起點與終點不可相同')
    await expect(page.getByRole('status')).not.toContainText('HK$0')
  })

  test('switches between English and Chinese', async ({ page }) => {
    await gotoApp(page)
    await expectStatus(page, '請選擇起訖站')
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'HK Commute Fare' })).toBeVisible()
    await expectStatus(page, 'Select origin and destination')
    await page.getByRole('button', { name: '繁中' }).click()
    await expect(page.getByRole('heading', { name: 'HK通勤車費查詢' })).toBeVisible()
    await expectStatus(page, '請選擇起訖站')
  })

  test('unavailable partner is not selectable after one end is set', async ({
    page,
  }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '尖', /尖沙咀/)

    await page.getByLabel('終點搜尋').fill('尖東')
    const listbox = page.getByRole('listbox', { name: '終點搜尋結果' })
    const eastTst = listbox.getByRole('option', { name: /尖東/ })
    await expect(eastTst).toHaveAttribute('aria-disabled', 'true')
    await eastTst.click({ force: true })
    await expectStatus(page, '請選擇起訖站')
    await expect(page.getByRole('status')).not.toContainText(
      '無法顯示該程車費',
    )

    await page.getByLabel('終點按綫選站').selectOption('tuen-ma')
    const destStation = page.getByLabel('終點選站')
    await expect(
      destStation.locator('option[value="east-tsim-sha-tsui"]'),
    ).toBeDisabled()
  })
})

test.describe('acceptance mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('mobile viewport completes main flow', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectBreakdownFare(page, /HK\$13\.2/)
  })
})

// ── Day5 acceptance: two legs, early bird, fare-saver, map ───────────────────

test.describe('Day5 acceptance: multi-leg & early bird', () => {
  test('add second leg section is revealed and can be removed', async ({ page }) => {
    await gotoApp(page)
    const addBtn = page.getByRole('button', { name: /加入第二程/ })
    await expect(addBtn).toBeVisible()
    await addBtn.click()

    const leg2Section = page.getByRole('region', { name: '第二程' })
    await expect(leg2Section).toBeVisible()

    // Light Rail mode should be active (auto-switched when leg1=MTR)
    await expect(leg2Section.getByRole('button', { name: /輕鐵（LR）/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // Bus is disabled in both legs
    const busBtns = page.getByRole('button', { name: /巴士／小巴/ })
    for (const btn of await busBtns.all()) {
      await expect(btn).toBeDisabled()
    }

    await page.getByRole('button', { name: /移除第二程/ }).click()
    await expect(leg2Section).not.toBeVisible()
  })

  test('early bird checkbox → earlyBirdDiscount visible in breakdown', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)

    const breakdown = page.getByRole('region', { name: '車費分項' })
    await expect(breakdown).toBeVisible()

    // No early bird row initially
    await expect(breakdown.getByText(/早晨折扣（25%）/)).not.toBeVisible()

    await page.getByRole('checkbox', { name: /早晨折扣/ }).check()
    await expect(breakdown.getByText(/早晨折扣（25%）/)).toBeVisible()
    await expect(breakdown.getByText(/估計應付/)).toBeVisible()

    // Estimated payable = 13.2 * 0.75 = 9.9 (also appears as afterEarlyBird dd)
    await expect(breakdown.getByRole('strong').filter({ hasText: /HK\$9\.9/ })).toBeVisible()
  })

  test('official vs personal labels in breakdown', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)

    const breakdown = page.getByRole('region', { name: '車費分項' })
    // Official label on subtotal
    await expect(breakdown.getByText('官方')).toBeVisible()

    // Set personal % to 10
    await page.getByLabel(/個人優惠/).fill('10')
    await expect(breakdown.getByText('個人估算')).toBeVisible()
  })

  test('navigate to fare-saver page', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('link', { name: '港鐵特惠站' }).click()
    await expect(page).toHaveURL(/#\/fare-saver/)
    await expect(page.getByRole('heading', { name: /特惠站/ })).toBeVisible()
    await expect(page.getByRole('note')).toContainText('不自動扣減')
    // Stations table is present
    await expect(page.getByRole('table')).toBeVisible()
  })
})
