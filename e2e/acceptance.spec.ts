import { test, expect } from '@playwright/test'
import { gotoApp, pickBySearch, expectStatus } from './helpers'

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
    await expectStatus(page, /HK\$/)
  })

  test('swap keeps fare amount', async ({ page }) => {
    await gotoApp(page)
    await pickBySearch(page, '起點', '金', /金鐘/)
    await pickBySearch(page, '終點', '旺', /旺角/)
    await expectStatus(page, /HK\$13\.2/)
    await page.getByRole('button', { name: '對調起訖' }).click()
    await expect(page.getByLabel('起點搜尋')).toHaveValue('旺角')
    await expect(page.getByLabel('終點搜尋')).toHaveValue('金鐘')
    await expectStatus(page, /HK\$13\.2/)
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
    await expectStatus(page, /HK\$13\.2/)
  })
})
