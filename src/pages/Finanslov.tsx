import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAllFinanslov, useFinanslovSearch, useAvailableYears } from '../hooks/useFinanslov'
import type { BudgetNode, CompareItem, HierarchyLevel, ValueKey } from '../lib/finanslov/types'
import { COMPARE_COLORS, VALUE_KEY_LABELS } from '../lib/finanslov/types'
import { exportComparisonCSV, exportYearCSV } from '../lib/finanslov/export'
import { formatBudgetCompact, formatDanishNumber } from '../lib/finanslov/formatter'
import BudgetTree from '../components/finanslov/BudgetTree'
import CompareCanvas from '../components/finanslov/CompareCanvas'
import LineChart from '../components/finanslov/LineChart'

export default function Finanslov() {
  // Hent tilgængelige år og alle data
  const availableYears = useAvailableYears()
  const allData = useAllFinanslov()

  // UI state
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<HierarchyLevel | null>(null)
  const [compareItems, setCompareItems] = useState<CompareItem[]>([])
  const [valueKey, setValueKey] = useState<ValueKey>('R')

  // Sæt default år når data er indlæst
  useEffect(() => {
    if (availableYears.data && availableYears.data.length > 0 && selectedYear === null) {
      // Vælg det nyeste år som default
      setSelectedYear(Math.max(...availableYears.data))
    }
  }, [availableYears.data, selectedYear])

  // Nuværende års data
  const currentYearData = selectedYear !== null ? allData.data?.get(selectedYear) : undefined

  // Søgefiltreret træ
  const filteredTree = useFinanslovSearch(currentYearData, searchTerm)

  // Drag-and-drop handlers
  const handleDragStart = useCallback((_node: BudgetNode) => {
    // Kunne bruges til at vise ghost preview osv.
  }, [])

  const handleAddCompareItem = useCallback((node: BudgetNode) => {
    setCompareItems((prev) => {
      // Tjek om allerede tilføjet
      if (prev.some((item) => item.node.code === node.code && item.node.year === node.year)) {
        return prev
      }
      if (prev.length >= COMPARE_COLORS.length) {
        return prev
      }
      const color = COMPARE_COLORS[prev.length]
      return [...prev, { node, color }]
    })
  }, [])

  const handleRemoveCompareItem = useCallback((index: number) => {
    setCompareItems((prev) => {
      const next = prev.filter((_, i) => i !== index)
      // Re-assign farver for at undgå huller
      return next.map((item, i) => ({ ...item, color: COMPARE_COLORS[i] }))
    })
  }, [])

  // Standardkonto filter
  const [standardkontoFilter, setStandardkontoFilter] = useState<string | null>(null)

  // Eksport
  const handleExportComparison = useCallback(() => {
    if (compareItems.length > 0) {
      exportComparisonCSV(compareItems.map((item) => item.node))
    }
  }, [compareItems])

  const handleExportYear = useCallback(() => {
    if (currentYearData && selectedYear !== null) {
      exportYearCSV(currentYearData.nodes, selectedYear)
    }
  }, [currentYearData, selectedYear])

  // Stats - baseret på valgt valueKey
  const stats = useMemo(() => {
    if (!currentYearData) return null

    const paragraphs = currentYearData.tree.filter((n) => n.level === 'paragraf')
    const total = paragraphs.reduce((sum, n) => sum + n.values[valueKey], 0)
    const totalPositive = paragraphs.filter((n) => n.values[valueKey] > 0).reduce((sum, n) => sum + n.values[valueKey], 0)
    const totalNegative = paragraphs.filter((n) => n.values[valueKey] < 0).reduce((sum, n) => sum + n.values[valueKey], 0)

    return {
      total,
      totalPositive,
      totalNegative,
      ministryCount: paragraphs.filter((n) => n.values[valueKey] !== 0).length,
      accountCount: currentYearData.nodes.length,
    }
  }, [currentYearData, valueKey])

  // Tidsserie-data for alle valgte elementer
  const timeSeriesData = useMemo(() => {
    if (compareItems.length === 0 || !allData.data) return []

    return compareItems.map(({ node, color }) => {
      const points: { year: number; value: number }[] = []

      for (const [fileYear, data] of allData.data!) {
        const foundNode = data.index[node.code]
        if (!foundNode) continue

        // Beregn faktisk år baseret på valueKey
        let actualYear: number
        if (valueKey === 'R') {
          actualYear = fileYear - 2 // Regnskab er 2 år før finanslovsåret
        } else if (valueKey === 'B') {
          actualYear = fileYear - 1 // Budget er 1 år før
        } else {
          actualYear = fileYear // Finanslov er samme år
        }

        points.push({
          year: actualYear,
          value: foundNode.values[valueKey],
        })
      }

      // Fjern dubletter
      const byYear = new Map<number, number>()
      for (const p of points) {
        byYear.set(p.year, p.value)
      }

      return {
        name: node.name,
        code: node.code,
        color,
        points: Array.from(byYear.entries())
          .map(([year, value]) => ({ year, value }))
          .sort((a, b) => a.year - b.year),
      }
    })
  }, [compareItems, allData.data, valueKey])

  // Tabeldata
  const tableData = useMemo(() => {
    if (compareItems.length === 0 || !allData.data) return { years: [] as number[], rows: [] as { name: string; code: string; color: string; values: Record<number, number> }[] }

    // Find alle år
    const allYears = new Set<number>()
    for (const series of timeSeriesData) {
      for (const point of series.points) {
        allYears.add(point.year)
      }
    }
    const years = Array.from(allYears).sort((a, b) => a - b)

    // Byg rækker
    const rows = timeSeriesData.map((series) => {
      const values: Record<number, number> = {}
      for (const point of series.points) {
        values[point.year] = point.value
      }
      return {
        name: series.name,
        code: series.code,
        color: series.color,
        values,
      }
    })

    return { years, rows }
  }, [compareItems, allData.data, timeSeriesData])

  // Eksportér tabel som CSV
  const handleExportTable = useCallback(() => {
    if (tableData.rows.length === 0) return

    const headers = ['Kode', 'Navn', ...tableData.years.map(String)]
    const csvRows = tableData.rows.map((row) => [
      row.code,
      row.name,
      ...tableData.years.map((year) => formatDanishNumber(row.values[year] ?? 0, 1)),
    ])

    const csv = [headers, ...csvRows].map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finanslov-tidsserie-${valueKey}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [tableData, valueKey])

  // Find alle standardkonti i de valgte elementer (for filter)
  const availableStandardkonti = useMemo(() => {
    if (!currentYearData) return []

    const konti = new Map<string, string>()
    for (const node of currentYearData.nodes) {
      if (node.level === 'standardkonto') {
        if (!konti.has(node.code)) {
          konti.set(node.code, node.name)
        }
      }
    }

    return Array.from(konti.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [currentYearData])

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Data fra Finanslovsdatabasen</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Udforsk det danske statsbudget. Træk konti til højre for at sammenligne.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* R/B-vælger (uden F - foreløbigt finanslov bruges ikke) */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {(['R', 'B'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setValueKey(key)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  valueKey === key
                    ? 'bg-ft-red text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title={key === 'R' ? 'Regnskab' : 'Budget'}
              >
                {key}
              </button>
            ))}
          </div>

          {/* År-vælger */}
          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
          >
            {availableYears.data?.map((year) => (
              <option key={year} value={year}>
                FL {year}
              </option>
            ))}
          </select>

          {/* Eksport dropdown */}
          <div className="relative group">
            <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Eksportér
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={handleExportComparison}
                disabled={compareItems.length === 0}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Eksportér sammenligning
              </button>
              <button
                onClick={handleExportYear}
                disabled={!currentYearData}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Eksportér FL {selectedYear}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats kort */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(stats.totalPositive / 1000).toLocaleString('da-DK', { maximumFractionDigits: 0 })} mia.
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Udgifter</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(Math.abs(stats.totalNegative) / 1000).toLocaleString('da-DK', { maximumFractionDigits: 0 })} mia.
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Indtægter</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ministryCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Ministerier</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.accountCount.toLocaleString('da-DK')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Konti i alt</div>
          </div>
        </div>
      )}

      {/* Hovedindhold */}
      {allData.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-ft-red border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Indlæser finanslovsdata...</p>
          </div>
        </div>
      ) : allData.error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-xl">
          <h3 className="font-semibold mb-2">Kunne ikke indlæse data</h3>
          <p className="text-sm">{(allData.error as Error).message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Venstre panel: Træ */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow h-[600px] overflow-hidden">
            <BudgetTree
              tree={filteredTree}
              onDragStart={handleDragStart}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              levelFilter={levelFilter}
              onLevelFilterChange={setLevelFilter}
            />
          </div>

          {/* Højre panel: Sammenligning + visualiseringer */}
          <div className="lg:col-span-8 space-y-6">
            {/* Sammenligningscanvas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 min-h-[150px]">
              <CompareCanvas
                items={compareItems}
                onAddItem={handleAddCompareItem}
                onRemoveItem={handleRemoveCompareItem}
                allData={allData.data}
              />
            </div>

            {/* Stor tidsserie */}
            {compareItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tidsserie ({VALUE_KEY_LABELS[valueKey]})
                  </h3>
                  <button
                    onClick={handleExportTable}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Eksportér CSV
                  </button>
                </div>

                {/* Stor graf */}
                <div className="h-[300px]">
                  <LineChart
                    items={compareItems}
                    allData={allData.data ?? new Map()}
                    valueKey={valueKey}
                    title=""
                    large
                  />
                </div>

                {/* Tabel */}
                {tableData.rows.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 pr-4 text-gray-600 dark:text-gray-400 font-medium sticky left-0 bg-white dark:bg-gray-800">Konto</th>
                          {tableData.years.map((year) => (
                            <th key={year} className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                              {year}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row) => (
                          <tr key={row.code} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-2 pr-4 sticky left-0 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                                <span className="text-gray-500 dark:text-gray-500 font-mono text-xs">{row.code}</span>
                                <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{row.name}</span>
                              </div>
                            </td>
                            {tableData.years.map((year) => (
                              <td key={year} className="text-right py-2 px-2 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {row.values[year] !== undefined ? formatBudgetCompact(row.values[year]) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Standardkonto filter (når elementer er valgt) */}
            {compareItems.length > 0 && availableStandardkonti.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Standardkonto filter
                  </h3>
                  <select
                    value={standardkontoFilter ?? ''}
                    onChange={(e) => setStandardkontoFilter(e.target.value || null)}
                    className="text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                  >
                    <option value="">Alle standardkonti</option>
                    {availableStandardkonti.map((konto) => (
                      <option key={konto.code} value={konto.code}>
                        {konto.code} - {konto.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Vælg en standardkonto for at filtrere visningen.
                </p>
              </div>
            )}

            {/* Placeholder når ingen elementer er valgt */}
            {compareItems.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mb-2">Vælg konti fra træet til venstre for at se tidsserie og tabel.</p>
                <p className="text-sm">Klik på + ikonet ved en konto for at tilføje den til sammenligningen.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
