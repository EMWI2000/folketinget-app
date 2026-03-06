import { useState, useMemo } from 'react'
import type { BenchmarkRaekke } from '../../lib/loendata/types'
import { COMPARE_COLORS } from '../../lib/loendata/types'
import { formatLoen, formatAarsvaerk } from '../../lib/loendata/parser'

interface BenchmarkTabelProps {
  data: BenchmarkRaekke[]
  selectedNavne: string[]
  onToggleSelect: (navn: string) => void
}

type SortKey = 'navn' | 'aarsvaerk' | 'samletLon' | 'basislon' | 'pension' | 'fasteMidlCentrale' | 'fasteLokale' | 'midlertLokale' | 'engangsvederlag'

export default function BenchmarkTabel({ data, selectedNavne, onToggleSelect }: BenchmarkTabelProps) {
  const [sortKey, setSortKey] = useState<SortKey>('aarsvaerk')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let cmp: number
      if (sortKey === 'navn') {
        cmp = a.navn.localeCompare(b.navn, 'da')
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number)
      }
      return sortAsc ? cmp : -cmp
    })
  }, [data, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const SortHeader = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th
      className={`py-2 px-2 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors select-none ${className || ''}`}
      onClick={() => handleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortAsc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
          </svg>
        )}
      </span>
    </th>
  )

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center text-gray-500 dark:text-gray-400">
        Ingen data matcher de valgte filtre.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Benchmark – hovedkonti ({data.length})
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Klik på en række for at vælge den til sammenligning. Løn er vægtet gennemsnit pr. måned i kr.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs">
              <th className="w-8"></th>
              <SortHeader k="navn" label="Hovedkonto" className="text-left pl-2" />
              <SortHeader k="aarsvaerk" label="Årsværk" className="text-right" />
              <SortHeader k="samletLon" label="Samlet løn" className="text-right" />
              <SortHeader k="basislon" label="Basisløn" className="text-right" />
              <SortHeader k="pension" label="Pension" className="text-right" />
              <SortHeader k="fasteMidlCentrale" label="Centr. tillæg" className="text-right" />
              <SortHeader k="fasteLokale" label="Lok. faste" className="text-right" />
              <SortHeader k="midlertLokale" label="Lok. midl." className="text-right" />
              <SortHeader k="engangsvederlag" label="Engangs" className="text-right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isSelected = selectedNavne.includes(row.navn)
              const colorIdx = selectedNavne.indexOf(row.navn)
              const color = colorIdx >= 0 ? COMPARE_COLORS[colorIdx % COMPARE_COLORS.length] : undefined

              return (
                <tr
                  key={row.navn}
                  onClick={() => onToggleSelect(row.navn)}
                  className={`border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-gray-50 dark:bg-gray-700/50'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <td className="py-2 pl-3">
                    <div
                      className={`w-3 h-3 rounded-full ${isSelected ? '' : 'bg-gray-300 dark:bg-gray-600'}`}
                      style={isSelected ? { backgroundColor: color } : {}}
                    />
                  </td>
                  <td className="py-2 pl-2 pr-4">
                    <div className="font-medium text-gray-900 dark:text-white text-xs">{row.navn}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{row.type}</div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-700 dark:text-gray-300">
                    {formatAarsvaerk(row.aarsvaerk)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-semibold text-gray-900 dark:text-white">
                    {formatLoen(row.samletLon)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatLoen(row.basislon)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatLoen(row.pension)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatLoen(row.fasteMidlCentrale)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatLoen(row.fasteLokale)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatLoen(row.midlertLokale)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatLoen(row.engangsvederlag)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
