/**
 * Day3 RTL tests:
 * - Second leg mode selector (Bus option is disabled)
 * - Early bird checkbox shows earlyBirdDiscount in fare breakdown
 * - Language switch updates labels
 * - Navigate to fare-saver page via nav link
 * - Personal % renders non-official note
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

beforeEach(() => {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    get: () => 'zh-HK',
  })
  // Reset hash so HashRouter always starts at '/' between tests
  window.location.hash = ''
})

async function pickBySearch(
  user: ReturnType<typeof userEvent.setup>,
  legend: string,
  query: string,
  optionName: RegExp,
) {
  const isEn = legend === 'Origin' || legend === 'Destination'
  const searchLabel = isEn ? `${legend} search` : `${legend}搜尋`
  const listName = isEn ? `${legend} search results` : `${legend}搜尋結果`

  await user.type(screen.getByLabelText(searchLabel), query)
  const listbox = screen.getByRole('listbox', { name: listName })
  await user.click(within(listbox).getByRole('option', { name: optionName }))
}

// Helper: find the breakdown section by its heading text (it's a role="region")
function getBreakdown() {
  return screen.getByRole('region', { name: '車費分項' })
}

describe('Day3: navigation', () => {
  it('shows nav links for home and fare saver', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: '車費查詢' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '港鐵特惠站' })).toBeInTheDocument()
  })

  it('navigates to fare-saver page and shows disclaimer', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: '港鐵特惠站' }))

    expect(screen.getByRole('heading', { name: /特惠站/ })).toBeInTheDocument()
    expect(screen.getByRole('note')).toBeInTheDocument()
    // Disclaimer mentions no auto-deduction
    expect(screen.getByRole('note')).toHaveTextContent(/不自動扣減/)
  })

  it('navigates back to home from fare-saver', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: '港鐵特惠站' }))
    await user.click(screen.getByRole('link', { name: '車費查詢' }))

    expect(screen.getByRole('heading', { name: 'HK通勤車費查詢' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('請選擇起訖站')
  })
})

describe('Day3: mode selector', () => {
  it('renders MTR and Light Rail mode buttons (Bus disabled)', () => {
    render(<App />)
    // The MTR button uses the zh label from i18n
    const mtrBtns = screen.getAllByRole('button', { name: /港鐵（MTR）/ })
    const lrBtns = screen.getAllByRole('button', { name: /輕鐵（LR）/ })
    const busBtns = screen.getAllByRole('button', { name: /巴士／小巴/ })

    expect(mtrBtns.length).toBeGreaterThanOrEqual(1)
    expect(lrBtns.length).toBeGreaterThanOrEqual(1)
    busBtns.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('MTR button is active by default (aria-pressed=true)', () => {
    render(<App />)
    // The first mode selector (leg 1) should have MTR active
    const mtrBtns = screen.getAllByRole('button', { name: /港鐵（MTR）/ })
    expect(mtrBtns[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('Light Rail mode lets user pick by route number then station', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: /輕鐵（LR）/ })[0])

    const originLine = screen.getByLabelText('起點按綫選站')
    expect(originLine).toBeInTheDocument()
    expect(within(originLine).getByRole('option', { name: '507' })).toBeInTheDocument()

    await user.selectOptions(originLine, '507')
    const originStation = screen.getByLabelText('起點選站')
    expect(within(originStation).getByRole('option', { name: '屯門碼頭' })).toBeInTheDocument()
    expect(within(originStation).getByRole('option', { name: '田景' })).toBeInTheDocument()

    await user.selectOptions(originStation, 'lr-tuen-mun')
    expect(originStation).toHaveValue('lr-tuen-mun')
    expect(screen.getByText(/已選：屯門/)).toBeInTheDocument()
  })

  it('Light Rail search by route number selects the line dropdown for station pick', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: /輕鐵（LR）/ })[0])

    const originSearch = screen.getByLabelText('起點搜尋')
    await user.type(originSearch, '507')

    const originLine = screen.getByLabelText('起點按綫選站')
    expect(originLine).toHaveValue('507')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    const originStation = screen.getByLabelText('起點選站')
    expect(within(originStation).getByRole('option', { name: '田景' })).toBeInTheDocument()

    await user.selectOptions(originStation, 'lr-tin-king')
    expect(originStation).toHaveValue('lr-tin-king')
    expect(screen.getByText(/已選：田景/)).toBeInTheDocument()
  })
})

describe('Day3: add second leg', () => {
  it('shows "add second leg" button by default', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /加入第二程/ })).toBeInTheDocument()
  })

  it('reveals second leg section when add button clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /加入第二程/ }))

    expect(screen.getByRole('region', { name: '第二程' })).toBeInTheDocument()
    // Two mode selector groups now exist (one per leg)
    const allMtrBtns = screen.getAllByRole('button', { name: /港鐵（MTR）/ })
    expect(allMtrBtns.length).toBeGreaterThanOrEqual(2)
  })

  it('second leg has Bus option disabled', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /加入第二程/ }))

    const busBtns = screen.getAllByRole('button', { name: /巴士／小巴/ })
    busBtns.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('remove second leg button hides the second leg section', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /加入第二程/ }))
    expect(screen.getByRole('region', { name: '第二程' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /移除第二程/ }))
    expect(screen.queryByRole('region', { name: '第二程' })).not.toBeInTheDocument()
  })

  it('swap legs reverses modes and stations end-to-end', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘/)
    await pickBySearch(user, '終點', '屯門', /屯門/)

    await user.click(screen.getByRole('button', { name: /加入第二程/ }))
    expect(screen.getByRole('button', { name: '對調兩程' })).toBeDisabled()

    await pickBySearch(user, '第二程終點', '兆', /兆康/)

    const swapBtn = screen.getByRole('button', { name: '對調兩程' })
    expect(swapBtn).toBeEnabled()
    await user.click(swapBtn)

    const lrBtns = screen.getAllByRole('button', { name: /輕鐵（LR）/ })
    const mtrBtns = screen.getAllByRole('button', { name: /港鐵（MTR）/ })
    expect(lrBtns[0]).toHaveAttribute('aria-pressed', 'true')
    expect(mtrBtns[1]).toHaveAttribute('aria-pressed', 'true')

    expect(screen.getByText(/已選：兆康/)).toBeInTheDocument()
    expect(screen.getByLabelText('起點選站')).toHaveValue('lr-siu-hong')
    expect(screen.getByLabelText('終點選站')).toHaveValue('lr-tuen-mun')
    expect(screen.getByLabelText('第二程終點選站')).toHaveValue('admiralty')

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: '車費分項' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: '車費分項' })).getAllByText(/HK\$/)
        .length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByRole('link', { name: /港鐵輕鐵及巴士服務/ }),
    ).toHaveAttribute(
      'href',
      'https://www.mtr.com.hk/ch/customer/services/lt_bus_index.html',
    )
  })
})

describe('Day3: early bird checkbox', () => {
  it('early bird checkbox is not rendered before stations are selected', () => {
    render(<App />)
    // Checkbox should not appear before both stations are selected
    expect(screen.queryByRole('checkbox', { name: /早晨折扣/ })).not.toBeInTheDocument()
  })

  it('shows early bird discount row in breakdown when checkbox checked', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Pick origin and destination
    await pickBySearch(user, '起點', '金', /金鐘/)
    await pickBySearch(user, '終點', '旺', /旺角/)

    // Modifiers panel should now be visible
    const checkbox = screen.getByRole('checkbox', { name: /早晨折扣/ })
    expect(checkbox).not.toBeChecked()

    // Breakdown should show fare WITHOUT earlyBird row initially
    expect(within(getBreakdown()).queryByText(/早晨折扣/)).not.toBeInTheDocument()

    // Check early bird
    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    // Breakdown should now show earlyBirdDiscount row
    expect(within(getBreakdown()).getByText(/早晨折扣/)).toBeInTheDocument()
    expect(within(getBreakdown()).getByText(/估計應付/)).toBeInTheDocument()

    // Payable lives in breakdown only (HK$9.9 = 13.2 * 0.75)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(within(getBreakdown()).getAllByText(/HK\$9\.9/).length).toBeGreaterThanOrEqual(
      1,
    )
  })

  it('early bird note (75折) is shown when modifiers panel is visible', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘/)
    await pickBySearch(user, '終點', '旺', /旺角/)

    expect(screen.getByText(/75 折/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /港鐵早晨折扣優惠/ }),
    ).toHaveAttribute('href', 'https://www.mtr.com.hk/ch/customer/main/early_bird.html')
  })
})

describe('Day3: personal % input', () => {
  it('personal % input appears after stations are selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘/)
    await pickBySearch(user, '終點', '旺', /旺角/)

    expect(screen.getByLabelText(/個人優惠/)).toBeInTheDocument()
    expect(screen.getByText(/非官方估算/)).toBeInTheDocument()
  })

  it('shows personal discount row in breakdown when personal % > 0', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘/)
    await pickBySearch(user, '終點', '旺', /旺角/)

    const pctInput = screen.getByLabelText(/個人優惠/)
    await user.clear(pctInput)
    await user.type(pctInput, '10')

    expect(within(getBreakdown()).getByText(/個人優惠減免/)).toBeInTheDocument()
    // personal badge should be visible
    expect(within(getBreakdown()).getByText('個人估算')).toBeInTheDocument()
  })
})

describe('Day3: language switch', () => {
  it('switches fare saver nav link to English', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('link', { name: '港鐵特惠站' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('link', { name: 'Fare Saver Stations' })).toBeInTheDocument()
  })

  it('switches mode selector labels to English', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'English' }))

    // Check that English mode labels appear
    expect(screen.getByRole('button', { name: 'MTR' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Light Rail (LR)' })).toBeInTheDocument()
  })

  it('fare saver page shows English content after lang switch', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'English' }))
    await user.click(screen.getByRole('link', { name: 'Fare Saver Stations' }))

    expect(screen.getByRole('heading', { name: /Fare Saver/ })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(/NOT automatically deducted/)
  })

  it('breakdown labels update after language switch', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pickBySearch(user, '起點', '金', /金鐘/)
    await pickBySearch(user, '終點', '旺', /旺角/)

    expect(screen.getByRole('region', { name: '車費分項' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('region', { name: 'Fare breakdown' })).toBeInTheDocument()
  })
})
