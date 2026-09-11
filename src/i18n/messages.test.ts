import { describe, expect, it } from 'vitest'
import { detectLocale, t } from './messages'

describe('i18n messages', () => {
  it('detects zh* as zh', () => {
    expect(detectLocale('zh-HK')).toBe('zh')
    expect(detectLocale('zh-TW')).toBe('zh')
  })

  it('detects other languages as en', () => {
    expect(detectLocale('en-US')).toBe('en')
    expect(detectLocale('ja')).toBe('en')
  })

  it('returns locale-specific copy', () => {
    expect(t('zh', 'incomplete')).toBe('請選擇起訖站')
    expect(t('en', 'incomplete')).toBe('Select origin and destination')
  })
})
