import { type Page, expect } from '@playwright/test'

/** Pick a station via search (zh-HK UI). */
export async function pickBySearch(
  page: Page,
  legend: '起點' | '終點',
  query: string,
  optionName: RegExp,
) {
  const search = page.getByLabel(`${legend}搜尋`)
  await search.fill(query)
  const listbox = page.getByRole('listbox', { name: `${legend}搜尋結果` })
  await listbox.getByRole('option', { name: optionName }).click()
}

export async function expectStatus(page: Page, text: string | RegExp) {
  await expect(page.getByRole('status')).toContainText(text)
}

export async function gotoApp(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'HK通勤車費查詢' }),
  ).toBeVisible()
}
