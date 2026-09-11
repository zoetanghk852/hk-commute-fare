import { formatFare } from '../domain/formatFare'
import { lookupFare, type FareMatrix } from '../domain/lookupFare'
import { t, type Locale } from '../i18n/messages'

export type FareStatus =
  | { kind: 'fare'; text: string }
  | { kind: 'incomplete'; text: string }
  | { kind: 'sameStation'; text: string }
  | { kind: 'missingFare'; text: string }

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

  if (result.error.code === 'same_station') {
    return { kind: 'sameStation', text: t(locale, 'sameStation') }
  }

  return { kind: 'missingFare', text: t(locale, 'missingFare') }
}
