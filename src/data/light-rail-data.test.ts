/**
 * Contract: Light Rail stations + adult Octopus fare matrix
 * cover the full published network (not a demo subset).
 */
import { describe, expect, it } from 'vitest'
import lrFaresJson from './light-rail-fares.json' with { type: 'json' }
import lrMetaJson from './light-rail-fares.meta.json' with { type: 'json' }
import lrRoutesJson from './light-rail-routes.json' with { type: 'json' }
import lrStationsJson from './light-rail-stations.json' with { type: 'json' }
import { lookupLightRailFare } from '../domain/lookupLightRailFare'
import type { FareMatrix } from '../domain/lookupFare'
import type { Station } from '../domain/searchStations'

const stations = lrStationsJson as Station[]
const matrix = lrFaresJson as FareMatrix
const routes = lrRoutesJson as Record<string, string[]>
const meta = lrMetaJson as {
  asOf: string
  mtrLrFreeAdultMax: number
  notes?: string[]
}

describe('light-rail data contract (full network)', () => {
  it('includes all published Light Rail stops (~68) with route lineIds', () => {
    expect(stations.length).toBeGreaterThanOrEqual(68)
    const ids = new Set(stations.map((s) => s.id))
    expect(ids.size).toBe(stations.length)
    expect(stations.every((s) => s.lineIds.length > 0)).toBe(true)
    expect(stations.every((s) => s.lineIds.every((id) => /^\d/.test(id)))).toBe(true)

    const ferry = stations.find((s) => s.id === 'lr-tuen-mun-ferry-pier')
    const tinKing = stations.find((s) => s.id === 'lr-tin-king')
    expect(ferry?.lineIds).toContain('507')
    expect(tinKing?.lineIds).toContain('507')
  })

  it('lists route 507 stops in Direction 1 order (ferry pier → tin king)', () => {
    expect(routes['507']?.[0]).toBe('lr-tuen-mun-ferry-pier')
    expect(routes['507']?.at(-1)).toBe('lr-tin-king')
  })

  it('keeps interchange + sample OD fares used by V2a journeys', () => {
    expect(stations.some((s) => s.id === 'lr-tuen-mun' && s.mtrInterchangeId === 'tuen-mun')).toBe(
      true,
    )
    expect(stations.some((s) => s.id === 'lr-town-centre')).toBe(true)
    expect(stations.some((s) => s.id === 'lr-hung-shui-kiu')).toBe(true)

    expect(lookupLightRailFare('lr-tuen-mun', 'lr-town-centre', matrix)).toEqual({
      ok: true,
      amount: 5.1,
    })
    expect(lookupLightRailFare('lr-tuen-mun', 'lr-yuen-long', matrix)).toEqual({
      ok: true,
      amount: 6.5,
    })
  })

  it('covers every distinct OD among stations (no missing pairwise adult fare)', () => {
    const ids = stations.map((s) => s.id)
    let pairs = 0
    let missing = 0
    for (const fromId of ids) {
      for (const toId of ids) {
        if (fromId === toId) continue
        pairs += 1
        const result = lookupLightRailFare(fromId, toId, matrix)
        if (!result.ok) missing += 1
      }
    }
    expect(pairs).toBe(ids.length * (ids.length - 1))
    expect(missing).toBe(0)
    expect(Object.keys(matrix).length).toBe(pairs)
  })

  it('records mtr_lr_free threshold in meta', () => {
    expect(meta.mtrLrFreeAdultMax).toBe(5.4)
    expect(meta.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
