import { describe, expect, it } from 'vitest'
import { t } from './messages'

describe('i18n messages', () => {
  it('returns locale-specific copy', () => {
    expect(t('zh', 'incomplete')).toBe('請選擇起訖站')
    expect(t('en', 'incomplete')).toBe('Select origin and destination')
  })

  it('includes swap-legs labels', () => {
    expect(t('zh', 'swapLegs')).toBe('對調兩程')
    expect(t('en', 'swapLegs')).toBe('Swap legs')
    expect(t('zh', 'dragLegHandle')).toBe('拖曳以對調兩程順序')
  })

  it('includes official discount notes and ref labels', () => {
    expect(t('zh', 'earlyBirdRef')).toContain('早晨折扣')
    expect(t('zh', 'mtrLrFreeRef')).toContain('輕鐵')
    expect(t('zh', 'mtrLrFreeNote')).toContain('$5.4')
  })
})
