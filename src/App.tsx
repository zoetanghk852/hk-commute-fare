import { useState } from 'react'
import faresJson from './data/fares.json' with { type: 'json' }
import faresMetaJson from './data/fares.meta.json' with { type: 'json' }
import stationsJson from './data/stations.json' with { type: 'json' }
import { hasFare } from './domain/hasFare'
import type { FareMatrix } from './domain/lookupFare'
import type { Station } from './domain/searchStations'
import {
  detectLocale,
  stationPrimaryName,
  stationSecondaryName,
  t,
  type Locale,
} from './i18n/messages'
import { fareStatusMessage } from './ui/fareStatusMessage'
import { StationPicker } from './ui/StationPicker'
import './App.css'

const stations = stationsJson as Station[]
const fareMatrix = faresJson as FareMatrix
const faresAsOf = (faresMetaJson as { asOf?: string }).asOf ?? '—'

function App() {
  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(null)
  const [locale, setLocale] = useState<Locale>(() => detectLocale())

  const fromStation = stations.find((s) => s.id === fromId)
  const toStation = stations.find((s) => s.id === toId)
  const fareStatus = fareStatusMessage(
    fromId,
    toId,
    fareMatrix,
    locale,
  )
  const showsFare = fareStatus.kind === 'fare'

  function swapStations() {
    setFromId(toId)
    setToId(fromId)
  }

  function formatJourneyEnd(station: Station | undefined): string {
    if (!station) return t(locale, 'journeyUnknown')
    return `${stationPrimaryName(station, locale)} ${stationSecondaryName(station, locale)}`
  }

  /** Disable missing-fare partners; keep same-station selectable. */
  function isSelectableAgainst(
    otherId: string | null,
  ): (stationId: string) => boolean {
    return (stationId) => {
      if (!otherId) return true
      if (stationId === otherId) return true
      return hasFare(stationId, otherId, fareMatrix)
    }
  }

  return (
    <main className="app">
      <header className="brand">
        <div className="brand-top">
          <p className="brand-eyebrow">{t(locale, 'brandEyebrow')}</p>
          <div
            className="lang-switch"
            role="group"
            aria-label={t(locale, 'language')}
          >
            <button
              type="button"
              className={
                locale === 'zh' ? 'lang-btn is-active' : 'lang-btn'
              }
              aria-pressed={locale === 'zh'}
              onClick={() => setLocale('zh')}
            >
              {t(locale, 'langZh')}
            </button>
            <button
              type="button"
              className={
                locale === 'en' ? 'lang-btn is-active' : 'lang-btn'
              }
              aria-pressed={locale === 'en'}
              onClick={() => setLocale('en')}
            >
              {t(locale, 'langEn')}
            </button>
          </div>
        </div>
        <h1>{t(locale, 'brandTitle')}</h1>
        <p className="tagline">{t(locale, 'tagline')}</p>
      </header>

      <section className="panel" aria-label={t(locale, 'fareQuery')}>
        <StationPicker
          legend={t(locale, 'origin')}
          stations={stations}
          selectedId={fromId}
          onSelect={setFromId}
          locale={locale}
          isSelectable={isSelectableAgainst(toId)}
        />

        <div className="swap-row">
          <button
            type="button"
            className="swap-btn"
            onClick={swapStations}
            aria-label={t(locale, 'swap')}
          >
            {/* Repeat / sync arrows — accessible name is aria-label */}
            <svg
              className="swap-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
              focusable="false"
            >
              {/* Material-style sync / repeat arrows */}
              <path
                fill="currentColor"
                d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
              />
            </svg>
          </button>
        </div>

        <StationPicker
          legend={t(locale, 'destination')}
          stations={stations}
          selectedId={toId}
          onSelect={setToId}
          locale={locale}
          isSelectable={isSelectableAgainst(fromId)}
        />

        {(fromStation || toStation) && (
          <p className="journey-summary" aria-live="polite">
            {formatJourneyEnd(fromStation)}
            <span className="journey-arrow"> → </span>
            {formatJourneyEnd(toStation)}
          </p>
        )}

        <div className="result" role="status" aria-live="polite">
          <p
            className={
              showsFare ? 'result-message result-fare' : 'result-message'
            }
          >
            {fareStatus.text}
          </p>
        </div>
      </section>

      <p className="data-asof">
        {t(locale, 'dataAsOf').replace('{date}', faresAsOf)}
      </p>
    </main>
  )
}

export default App
