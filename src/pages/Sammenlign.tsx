import { useState, useMemo } from 'react'
import { usePerioder } from '../hooks/useAktstykker'
import { useSagerPerType, useAktstykkerPerMinisterium } from '../hooks/useStatistik'

import PeriodeSelect, { useDefaultPeriode } from '../components/PeriodeSelect'

const COLORS_A = '#a1172f'
const COLORS_B = '#2563eb'

export default function Sammenlign() {
  const perioder = usePerioder()
  const defaultPeriode = useDefaultPeriode(perioder.data)

  const [periodeA, setPeriodeA] = useState<number | null>(null)
  const [periodeB, setPeriodeB] = useState<number | null>(null)

  const aktA = periodeA ?? defaultPeriode
  // Sæt periode B til den næstnyeste som default
  const samlinger = useMemo(() => {
    if (!perioder.data) return []
    return perioder.data.filter((p) => p.type === 'samling')
  }, [perioder.data])

  const aktB = periodeB ?? (samlinger.length > 1 ? samlinger[1].id : null)

  const labelA = samlinger.find((p) => p.id === aktA)
  const labelB = samlinger.find((p) => p.id === aktB)

  const sagerA = useSagerPerType(aktA ?? undefined)
  const sagerB = useSagerPerType(aktB ?? undefined)
  const aktstykkerA = useAktstykkerPerMinisterium(aktA)
  const aktstykkerB = useAktstykkerPerMinisterium(aktB)

  // Merge sager-per-type for comparison
  const mergedSager = useMemo(() => {
    const map = new Map<string, { label: string; a: number; b: number }>()
    for (const item of sagerA.data ?? []) {
      map.set(item.label, { label: item.label, a: item.count, b: 0 })
    }
    for (const item of sagerB.data ?? []) {
      const existing = map.get(item.label)
      if (existing) {
        existing.b = item.count
      } else {
        map.set(item.label, { label: item.label, a: 0, b: item.count })
      }
    }
    return [...map.values()].sort((a, b) => (b.a + b.b) - (a.a + a.b))
  }, [sagerA.data, sagerB.data])

  // Merge aktstykker-per-ministerium
  const mergedAktstykker = useMemo(() => {
    const map = new Map<string, { label: string; a: number; b: number }>()
    for (const item of aktstykkerA.data ?? []) {
      map.set(item.label, { label: item.label, a: item.count, b: 0 })
    }
    for (const item of aktstykkerB.data ?? []) {
      const existing = map.get(item.label)
      if (existing) {
        existing.b = item.count
      } else {
        map.set(item.label, { label: item.label, a: 0, b: item.count })
      }
    }
    return [...map.values()].sort((a, b) => (b.a + b.b) - (a.a + a.b))
  }, [aktstykkerA.data, aktstykkerB.data])

  const isLoading = sagerA.isLoading || sagerB.isLoading || aktstykkerA.isLoading || aktstykkerB.isLoading

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Sammenlign perioder</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Sammenlign antal sager og aktstykker på tværs af to folketingssamlinger</p>
      </div>

      {/* Periode vælgere */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_A }} />
          <PeriodeSelect
            perioder={perioder.data}
            value={aktA}
            onChange={setPeriodeA}
          />
        </div>
        <span className="text-gray-400 self-center">vs.</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_B }} />
          <PeriodeSelect
            perioder={perioder.data}
            value={aktB}
            onChange={setPeriodeB}
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => <div key={j} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sager per type sammenligning */}
      {!isLoading && mergedSager.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sager fordelt efter type</h3>
          <div className="space-y-4">
            {mergedSager.map((item) => {
              const max = Math.max(item.a, item.b, 1)
              return (
                <div key={item.label}>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">{item.label}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-20 text-xs text-right text-gray-400">{labelA?.titel ?? ''}</div>
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{ width: `${Math.max((item.a / max) * 100, 2)}%`, backgroundColor: COLORS_A }}
                        />
                      </div>
                      <span className="w-12 text-xs font-semibold text-gray-700 dark:text-gray-300">{item.a.toLocaleString('da-DK')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 text-xs text-right text-gray-400">{labelB?.titel ?? ''}</div>
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{ width: `${Math.max((item.b / max) * 100, 2)}%`, backgroundColor: COLORS_B }}
                        />
                      </div>
                      <span className="w-12 text-xs font-semibold text-gray-700 dark:text-gray-300">{item.b.toLocaleString('da-DK')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Aktstykker per ministerium sammenligning */}
      {!isLoading && mergedAktstykker.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Aktstykker per ministerium</h3>
          <div className="space-y-4">
            {mergedAktstykker.slice(0, 15).map((item) => {
              const max = Math.max(item.a, item.b, 1)
              const diff = item.a - item.b
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium truncate">{item.label}</span>
                    <span className={`text-xs font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{ width: `${Math.max((item.a / max) * 100, 4)}%`, backgroundColor: COLORS_A }}
                        />
                      </div>
                      <span className="w-8 text-xs font-semibold text-gray-600 dark:text-gray-400">{item.a}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{ width: `${Math.max((item.b / max) * 100, 4)}%`, backgroundColor: COLORS_B }}
                        />
                      </div>
                      <span className="w-8 text-xs font-semibold text-gray-600 dark:text-gray-400">{item.b}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
