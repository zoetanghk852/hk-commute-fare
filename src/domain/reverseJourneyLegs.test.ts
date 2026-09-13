import { describe, expect, it } from 'vitest'
import { reverseJourneyLegs } from './reverseJourneyLegs'

describe('reverseJourneyLegs', () => {
  it('reverses same-mode two legs (A→B then B→C → C→B then B→A)', () => {
    expect(
      reverseJourneyLegs({
        leg1Mode: 'mtr',
        fromId: 'admiralty',
        toId: 'tuen-mun',
        leg2Mode: 'mtr',
        leg2FromId: 'tuen-mun',
        leg2ToId: 'siu-hong',
      }),
    ).toEqual({
      leg1Mode: 'mtr',
      fromId: 'siu-hong',
      toId: 'tuen-mun',
      leg2Mode: 'mtr',
      leg2ToId: 'admiralty',
    })
  })

  it('reverses cross-mode MTR then LR', () => {
    expect(
      reverseJourneyLegs({
        leg1Mode: 'mtr',
        fromId: 'admiralty',
        toId: 'tuen-mun',
        leg2Mode: 'light_rail',
        leg2FromId: 'lr-tuen-mun',
        leg2ToId: 'lr-siu-hong',
      }),
    ).toEqual({
      leg1Mode: 'light_rail',
      fromId: 'lr-siu-hong',
      toId: 'lr-tuen-mun',
      leg2Mode: 'mtr',
      leg2ToId: 'admiralty',
    })
  })

  it('reverses cross-mode LR then MTR', () => {
    expect(
      reverseJourneyLegs({
        leg1Mode: 'light_rail',
        fromId: 'lr-siu-hong',
        toId: 'lr-tuen-mun',
        leg2Mode: 'mtr',
        leg2FromId: 'tuen-mun',
        leg2ToId: 'admiralty',
      }),
    ).toEqual({
      leg1Mode: 'mtr',
      fromId: 'admiralty',
      toId: 'tuen-mun',
      leg2Mode: 'light_rail',
      leg2ToId: 'lr-siu-hong',
    })
  })

  it('still maps when leg2FromId is present even if toId differs conceptually', () => {
    // Function trusts the provided leg2FromId; UI decides when it is valid.
    expect(
      reverseJourneyLegs({
        leg1Mode: 'mtr',
        fromId: 'admiralty',
        toId: 'central',
        leg2Mode: 'light_rail',
        leg2FromId: 'lr-tuen-mun',
        leg2ToId: 'lr-siu-hong',
      }),
    ).toEqual({
      leg1Mode: 'light_rail',
      fromId: 'lr-siu-hong',
      toId: 'lr-tuen-mun',
      leg2Mode: 'mtr',
      leg2ToId: 'admiralty',
    })
  })
})
