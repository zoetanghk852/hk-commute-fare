/**
 * Day3–4: fare display, swap, language switch (RTL).
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import faresMetaJson from './data/fares.meta.json' with { type: 'json' }
import App from './App'

beforeEach(() => {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    get: () => 'zh-HK',
  })
})

async function pickBySearch(
  user: ReturnType<typeof userEvent.setup>,
  legend: '起點' | '終點' | 'Origin' | 'Destination',
  query: string,
  optionName: RegExp,
) {
  const searchLabel =
    legend === '起點' || legend === 'Origin'
      ? legend === 'Origin'
        ? 'Origin search'
        : '起點搜尋'
      : legend === 'Destination'
        ? 'Destination search'
        : '終點搜尋'
  const listName =
    legend === 'Origin' || legend === 'Destination'
      ? `${legend} search results`
      : `${legend}搜尋結果`

  await user.type(screen.getByLabelText(searchLabel), query)
  const listbox = screen.getByRole('listbox', { name: listName })
  await user.click(within(listbox).getByRole('option', { name: optionName }))
}

describe('App fare display', () => {
  it('shows guide when stations are incomplete', () => {
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
  })

  it('shows HK$ when both stations have a fare', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘|Admiralty/)
    await pickBySearch(user, '終點', '旺', /旺角/)

    expect(screen.getByLabelText('起點搜尋')).toHaveValue('金鐘')
    expect(screen.getByLabelText('起點按綫選站')).toHaveValue('island')
    expect(screen.getByLabelText('起點選站')).toHaveValue('admiralty')
    expect(screen.getByLabelText('終點搜尋')).toHaveValue('旺角')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: '車費分項' })).getAllByText('HK$13.2')
        .length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('keeps fare after swapping origin and destination', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘|Admiralty/)
    await pickBySearch(user, '終點', '旺', /旺角/)
    expect(
      within(screen.getByRole('region', { name: '車費分項' })).getAllByText('HK$13.2')
        .length,
    ).toBeGreaterThanOrEqual(1)

    await user.click(
      screen.getByRole('button', { name: '對調起訖' }),
    )

    expect(screen.getByLabelText('起點搜尋')).toHaveValue('旺角')
    expect(screen.getByLabelText('終點搜尋')).toHaveValue('金鐘')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: '車費分項' })).getAllByText('HK$13.2')
        .length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('clears origin UI when swapping with only origin selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘|Admiralty/)
    await user.click(screen.getByRole('button', { name: '對調起訖' }))

    expect(screen.getByLabelText('起點搜尋')).toHaveValue('')
    expect(screen.getByText('尚未選站')).toBeInTheDocument()
    expect(screen.getByLabelText('終點搜尋')).toHaveValue('金鐘')
    expect(screen.getByText(/已選：金鐘/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
  })

  it('clears selection when editing search after a pick', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘|Admiralty/)
    await pickBySearch(user, '終點', '旺', /旺角/)
    expect(
      within(screen.getByRole('region', { name: '車費分項' })).getAllByText('HK$13.2')
        .length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    const originSearch = screen.getByLabelText('起點搜尋')
    await user.type(originSearch, 'x')

    expect(originSearch).toHaveValue('金鐘x')
    expect(screen.getByText('尚未選站')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
  })

  it('keeps a single status region when search has no match', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('起點搜尋'), 'zzzz')

    expect(screen.getByText('沒有符合的車站')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
  })

  it('shows same-station error', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '旺', /旺角/)
    await pickBySearch(user, '終點', '旺', /旺角/)

    expect(screen.getByRole('status')).toHaveTextContent(
      '起點與終點不可相同',
    )
  })

  it('disables destination without fare after origin is set', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '尖', /尖沙咀/)

    await user.type(screen.getByLabelText('終點搜尋'), '尖東')
    const listbox = screen.getByRole('listbox', { name: '終點搜尋結果' })
    const eastTst = within(listbox).getByRole('option', { name: /尖東/ })
    expect(eastTst).toHaveAttribute('aria-disabled', 'true')
    await user.click(eastTst)

    expect(screen.getByLabelText('終點搜尋')).toHaveValue('尖東')
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
    expect(screen.getByRole('status')).not.toHaveTextContent(
      '無法顯示該程車費',
    )
  })

  it('disables unavailable station in line dropdown', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '尖', /尖沙咀/)
    await user.selectOptions(screen.getByLabelText('終點按綫選站'), 'tuen-ma')

    const destStation = screen.getByLabelText('終點選站')
    const eastTstOption = within(destStation).getByRole('option', {
      name: '尖東',
    })
    expect(eastTstOption).toBeDisabled()
    expect(destStation).toHaveValue('')
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
    expect(screen.getByRole('status')).not.toHaveTextContent(
      '無法顯示該程車費',
    )
  })

  it('switches status copy to English', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
    await user.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Select origin and destination',
    )
    expect(
      screen.getByRole('heading', { name: 'HK Commute Fare' }),
    ).toBeInTheDocument()
  })

  it('scopes search to English names when locale is en', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'English' }))

    await user.type(screen.getByLabelText('Origin search'), '旺')
    const emptyList = screen.getByRole('listbox', { name: 'Origin search results' })
    expect(within(emptyList).queryByRole('option')).not.toBeInTheDocument()
    expect(within(emptyList).getByText('No matching stations')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Origin search'))
    await pickBySearch(user, 'Origin', 'adm', /Admiralty/)
    expect(screen.getByLabelText('Origin search')).toHaveValue('Admiralty')
  })

  it('uses Traditional Chinese as the preset even when navigator.language is en-US', () => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => 'en-US',
    })
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'HK通勤車費查詢' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
    expect(screen.getByRole('button', { name: '繁中' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('picks via line then station selects and can reset', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('起點按綫選站'), 'tsuen-wan')
    expect(screen.getByLabelText('起點按綫選站')).toHaveValue('tsuen-wan')

    const stationSelect = screen.getByLabelText('起點選站')
    await user.selectOptions(stationSelect, 'admiralty')

    expect(stationSelect).toHaveValue('admiralty')
    expect(screen.getByLabelText('起點搜尋')).toHaveValue('金鐘')
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')

    await user.click(screen.getByRole('button', { name: '清除起點' }))
    expect(screen.getByLabelText('起點搜尋')).toHaveValue('')
    expect(screen.getByLabelText('起點按綫選站')).toHaveValue('')
    expect(screen.queryByLabelText('起點選站')).not.toBeInTheDocument()
  })

  it('keeps line choice after clear then reselect, when switching to another line', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘/)
    await user.click(screen.getByRole('button', { name: '清除起點' }))
    await pickBySearch(user, '起點', '旺', /旺角/)

    // Mong Kok is on tsuen-wan / kwun-tong; switching to island should clear
    // the station but keep the newly chosen line so the station select stays usable.
    await user.selectOptions(screen.getByLabelText('起點按綫選站'), 'island')
    expect(screen.getByLabelText('起點按綫選站')).toHaveValue('island')
    expect(screen.getByLabelText('起點選站')).toBeInTheDocument()
    expect(screen.getByLabelText('起點選站')).toHaveValue('')
    expect(screen.getByLabelText('起點搜尋')).toHaveValue('')
  })

  it('selects search hit with ArrowDown and Enter', async () => {
    const user = userEvent.setup()
    render(<App />)

    const originSearch = screen.getByLabelText('起點搜尋')
    await user.type(originSearch, '金')
    await user.keyboard('{ArrowDown}{Enter}')

    expect(originSearch).toHaveValue('金鐘')
    expect(screen.getByLabelText('起點按綫選站')).toHaveValue('island')
    expect(screen.getByLabelText('起點選站')).toHaveValue('admiralty')
  })

  it('renders data-asof line with the date from fares.meta.json', () => {
    render(<App />)
    const asOf = (faresMetaJson as { asOf?: string }).asOf ?? '—'
    expect(
      screen.getByText(new RegExp(`票價資料截至 ${asOf}`)),
    ).toBeInTheDocument()
  })
})