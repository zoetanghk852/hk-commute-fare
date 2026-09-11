import { describe, expect, it, vi, afterEach } from 'vitest'
import { fareStatusMessage } from './fareStatusMessage'
import * as lookupFareModule from '../domain/lookupFare'

const matrix = {
  'admiralty:mong-kok': 9.2,
}

describe('fareStatusMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('asks to select stations when incomplete (zh)', () => {
    expect(fareStatusMessage(null, 'mong-kok', matrix, 'zh')).toEqual({
      kind: 'incomplete',
      text: '請選擇起訖站',
    })
  })

  it('asks to select stations when incomplete (en)', () => {
    expect(fareStatusMessage(null, 'mong-kok', matrix, 'en')).toEqual({
      kind: 'incomplete',
      text: 'Select origin and destination',
    })
  })

  it('formats successful lookup', () => {
    expect(fareStatusMessage('admiralty', 'mong-kok', matrix, 'zh')).toEqual({
      kind: 'fare',
      text: 'HK$9.2',
    })
  })

  it('maps same_station to UI copy', () => {
    expect(fareStatusMessage('mong-kok', 'mong-kok', matrix, 'zh')).toEqual({
      kind: 'sameStation',
      text: '起點與終點不可相同',
    })
    expect(fareStatusMessage('mong-kok', 'mong-kok', matrix, 'en')).toEqual({
      kind: 'sameStation',
      text: 'Origin and destination must differ',
    })
  })

  it('maps missing_fare to UI copy', () => {
    expect(
      fareStatusMessage('wan-chai', 'kwun-tong', matrix, 'en'),
    ).toEqual({
      kind: 'missingFare',
      text: 'Fare unavailable for this journey',
    })
  })

  it('maps unknown_station to UI copy (not missingFare)', () => {
    vi.spyOn(lookupFareModule, 'lookupFare').mockReturnValue({
      ok: false,
      error: { code: 'unknown_station', message: 'Unknown station' },
    })

    expect(fareStatusMessage('ghost', 'mong-kok', matrix, 'zh')).toEqual({
      kind: 'unknownStation',
      text: '找不到該車站',
    })
    expect(fareStatusMessage('ghost', 'mong-kok', matrix, 'en')).toEqual({
      kind: 'unknownStation',
      text: 'Unknown station',
    })
  })
})
