import type { TransportMode } from './journeyTypes'

export type ReverseJourneyLegsInput = {
  leg1Mode: TransportMode
  fromId: string
  toId: string
  leg2Mode: TransportMode
  /** Auto-derived interchange / continuing origin for leg 2 */
  leg2FromId: string
  leg2ToId: string
}

export type ReverseJourneyLegsResult = {
  leg1Mode: TransportMode
  fromId: string
  toId: string
  leg2Mode: TransportMode
  leg2ToId: string
}

/**
 * Reverse a two-leg journey end-to-end.
 *
 * Example: MTR A→B then LR B′→C becomes LR C→B′ then MTR B→A
 * (new leg-2 origin is re-derived by the UI from the new leg-1 destination).
 */
export function reverseJourneyLegs(
  input: ReverseJourneyLegsInput,
): ReverseJourneyLegsResult {
  return {
    leg1Mode: input.leg2Mode,
    fromId: input.leg2ToId,
    toId: input.leg2FromId,
    leg2Mode: input.leg1Mode,
    leg2ToId: input.fromId,
  }
}
