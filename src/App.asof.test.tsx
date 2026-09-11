/**
 * 回歸測試：當 fares.meta.json 缺少 asOf 欄位時，UI 應顯示 '—' 而非 undefined。
 * 根因：App.tsx 原本以 `as { asOf: string }` 強制轉型，
 *       缺少該屬性時 faresAsOf 為 undefined，導致 .replace() 輸出 "…undefined…"。
 * 修復：改為 `as { asOf?: string }` 並加上 `?? '—'` 預設值。
 */
import { vi } from 'vitest'

// 必須在任何 App import 之前宣告（vitest 會自動 hoist vi.mock）
vi.mock('./data/fares.meta.json', () => ({
  default: { currency: 'HKD' }, // 刻意省略 asOf
}))

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

beforeEach(() => {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    get: () => 'zh-HK',
  })
})

describe('App — asOf 缺失時的 fallback', () => {
  it('當 fares.meta.json 無 asOf 欄位時，顯示 em-dash 而非 undefined', () => {
    render(<App />)
    // locale = zh，段落應包含中文 label
    const asofEl = screen.getByText(/票價資料截至/)
    // 確認不含 "undefined"
    expect(asofEl.textContent).not.toContain('undefined')
    // 確認顯示 em-dash 作為預設值
    expect(asofEl.textContent).toContain('—')
  })
})
