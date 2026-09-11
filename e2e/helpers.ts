import { type Page, expect } from '@playwright/test'

/** Pick a station via search (zh or en UI labels). */
export async function pickBySearch(
  page: Page,
  legend: '起點' | '終點' | 'Origin' | 'Destination',
  query: string,
  optionName: RegExp,
) {
  const isEn = legend === 'Origin' || legend === 'Destination'
  const searchLabel = isEn ? `${legend} search` : `${legend}搜尋`
  const listName = isEn ? `${legend} search results` : `${legend}搜尋結果`
  const search = page.getByLabel(searchLabel)
  await search.fill(query)
  const listbox = page.getByRole('listbox', { name: listName })
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
