import fareSaverJson from '../data/fare-saver-stations.json' with { type: 'json' }
import { t, type Locale } from '../i18n/messages'

type FareSaverStation = {
  id: string
  nameZh: string
  nameEn: string
  mtrStationId: string
  location: string
}

const fareSaverStations = fareSaverJson as FareSaverStation[]

interface FareSaverPageProps {
  locale: Locale
}

export function FareSaverPage({ locale }: FareSaverPageProps) {
  return (
    <section className="panel" aria-label={t(locale, 'fareSaverTitle')}>
      <h2 className="section-title">{t(locale, 'fareSaverTitle')}</h2>

      <div className="fare-saver-disclaimer" role="note">
        <p>{t(locale, 'fareSaverDisclaimer')}</p>
      </div>

      <table className="fare-saver-table" aria-label={t(locale, 'fareSaverStation')}>
        <thead>
          <tr>
            <th scope="col">{t(locale, 'fareSaverStation')}</th>
            <th scope="col">{t(locale, 'fareSaverLocation')}</th>
          </tr>
        </thead>
        <tbody>
          {fareSaverStations.map((station) => (
            <tr key={station.id}>
              <td>{locale === 'en' ? station.nameEn : station.nameZh}</td>
              <td>{station.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
