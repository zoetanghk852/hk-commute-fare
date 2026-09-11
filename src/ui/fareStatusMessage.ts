import { formatFare } from '../domain/formatFare'
import { lookupFare, type FareMatrix } from '../domain/lookupFare'
import type { FareErrorCode } from '../domain/types'
import { t, type Locale } from '../i18n/messages'

export type FareStatus =
  | { kind: 'fare'; text: string }
  | { kind: 'incomplete'; text: string }
  | { kind: 'sameStation'; text: string }
  | { kind: 'missingFare'; text: string }
  | { kind: 'unknownStation'; text: string }

function statusFromErrorCode(
  code: FareErrorCode,
  locale: Locale,
): Exclude<FareStatus, { kind: 'fare' | 'incomplete' }> {
  switch (code) {
    case 'same_station':
      return { kind: 'sameStation', text: t(locale, 'sameStation') }
    case 'missing_fare':
      return { kind: 'missingFare', text: t(locale, 'missingFare') }
    case 'unknown_station':
      return { kind: 'unknownStation', text: t(locale, 'unknownStation') }
  }
}

/** Map lookup result to result-area copy (zh / en). */
export function fareStatusMessage(
  fromId: string | null,
  toId: string | null,
  matrix: FareMatrix,
  locale: Locale = 'zh',
): FareStatus {
  if (!fromId || !toId) {
    return { kind: 'incomplete', text: t(locale, 'incomplete') }
  }

  const result = lookupFare(fromId, toId, matrix)
  if (result.ok) {
    return { kind: 'fare', text: formatFare(result.amount) }
  }

  return statusFromErrorCode(result.error.code, locale)
}
