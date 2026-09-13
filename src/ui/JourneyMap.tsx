import { useEffect, useRef } from 'react'
import type { Station } from '../domain/searchStations'
import type { TransportMode } from '../domain/journeyTypes'

export type MapLeg = {
  mode: TransportMode
  fromId: string | null
  toId: string | null
}

interface JourneyMapProps {
  legs: MapLeg[]
  mtrStations: Station[]
  lrStations: Station[]
  locale?: 'zh' | 'en'
}

function findStation(
  id: string | null,
  mtrStations: Station[],
  lrStations: Station[],
): Station | undefined {
  if (!id) return undefined
  return mtrStations.find((s) => s.id === id) ?? lrStations.find((s) => s.id === id)
}

/**
 * Leaflet map showing origin / interchange / destination markers.
 * Uses dynamic import so jsdom test environments are unaffected.
 * Missing coords = no marker; fare calculation still works normally.
 */
export function JourneyMap({ legs, mtrStations, lrStations }: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Collect unique station IDs from legs
    const allIds: string[] = []
    for (const leg of legs) {
      if (leg.fromId) allIds.push(leg.fromId)
      if (leg.toId) allIds.push(leg.toId)
    }

    // Deduplicate while preserving order
    const uniqueIds = [...new Set(allIds)]

    // Map to Station objects with coordinates
    const points = uniqueIds
      .map((id) => findStation(id, mtrStations, lrStations))
      .filter((s): s is Station => !!s && s.lat !== undefined && s.lng !== undefined)

    if (points.length === 0) return

    // Dynamic import to avoid crashing jsdom tests
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/images/marker-icon-2x.png?url'),
      import('leaflet/dist/images/marker-icon.png?url'),
      import('leaflet/dist/images/marker-shadow.png?url'),
    ])
      .then(([L, icon2x, icon, shadow]) => {
        if (!containerRef.current) return

        // Vite: default marker URLs break; point Icon.Default at bundled assets
        delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
          ._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: icon2x.default,
          iconUrl: icon.default,
          shadowUrl: shadow.default,
        })

        // Clean up previous map instance
        if (mapRef.current) {
          ;(mapRef.current as { remove: () => void }).remove()
          mapRef.current = null
        }

        const map = L.map(containerRef.current)
        mapRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map)

        const bounds = L.latLngBounds([])

        points.forEach((station, index) => {
          const lat = station.lat!
          const lng = station.lng!
          const label =
            index === 0
              ? '起點'
              : index === points.length - 1
                ? '終點'
                : '轉乘'

          const marker = L.marker([lat, lng])
          marker.addTo(map)
          marker.bindPopup(`<strong>${station.nameZh}</strong><br/>${label}`)
          bounds.extend([lat, lng])
        })

        map.fitBounds(bounds, { padding: [30, 30] })
      })
      .catch(() => {
        // Leaflet unavailable (e.g. test environment) — silently skip map
      })

    return () => {
      if (mapRef.current) {
        ;(mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [legs, mtrStations, lrStations])

  return (
    <div
      ref={containerRef}
      style={{ height: '240px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}
      aria-label="行程地圖"
      data-testid="journey-map"
    />
  )
}
