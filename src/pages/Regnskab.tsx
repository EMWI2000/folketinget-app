import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAllRegnskab, useAvailableRegnskabYears } from '../hooks/useRegnskab'
import type { RegnskabNode, HierarchyLevel } from '../lib/regnskab/types'
import { LEVEL_LABELS, COMPARE_COLORS } from '../lib/regnskab/types'
import { formatRegnskab, formatRegnskabCompact, formatDanishNumber } from '../lib/regnskab/formatter'

interface CompareItem {
  node: RegnskabNode
  color: string
}

export default function Regnskab() {
  // Hent tilgængelige år og alle data
  const availableYears = useAvailableRegnskabYears()
  const allData = useAllRegnskab()

  // UI state
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<HierarchyLevel | null>(null)
  const [compareItems, setCompareItems] = useState<CompareItem[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [regnskabskontoFilter, setRegnskabskontoFilter] = useState<string | null>(null)

  // Sæt default år når data er indlæst
  useEffect(() => {
    if (availableYears.data && availableYears.data.length > 0 && selectedYear === null) {
      // Vælg det nyeste år som default
      setSelectedYear(Math.max(...availableYears.data))
    }
  }, [availableYears.data, selectedYear])

  // Nuværende års data
  const currentYearData = selectedYear !== null ? allData.data?.get(selectedYear) : undefined

  // Filtreret træ baseret på søgning
  const filteredTree = useMemo(() => {
    if (!currentYearData) return []
    if (searchTerm.length < 2) return currentYearData.tree

    const term = searchTerm.toLowerCase()
    const matchedIds = new Set<string>()

    for (const node of currentYearData.nodes) {
      if (
        node.code.toLowerCase().includes(term) ||
        node.name.toLowerCase().includes(term)
      ) {
        matchedIds.add(node.id)

        // Tilføj ancestors
        let parentCode = node.parentCode
        while (parentCode) {
          const parent = currentYearData.index[parentCode]
          if (parent) {
            matchedIds.add(parent.id)
            parentCode = parent.parentCode
          } else {
            parentCode = null
          }
        }
      }
    }

    function filterTree(nodes: RegnskabNode[]): RegnskabNode[] {
      return nodes
        .filter(n => matchedIds.has(n.id))
        .map(n => ({ ...n, children: filterTree(n.children) }))
    }

    return filterTree(currentYearData.tree)
  }, [currentYearData, searchTerm])

  // Toggle node expand/collapse
  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Tilføj til sammenligning
  const addToCompare = (node: RegnskabNode) => {
    setCompareItems((prev) => {
      if (prev.some((item) => item.node.id === node.id)) {
        return prev
      }
      if (prev.length >= COMPARE_COLORS.length) {
        return prev
      }
      const color = COMPARE_COLORS[prev.length]
      return [...prev, { node, color }]
    })
  }

  // Fjern fra sammenligning
  const removeFromCompare = (index: number) => {
    setCompareItems((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.map((item, i) => ({ ...item, color: COMPARE_COLORS[i] }))
    })
  }

  // Stats
  const stats = useMemo(() => {
    if (!currentYearData) return null

    const paragraphs = currentYearData.tree.filter((n) => n.level === 'paragraf')
    const totalYear1 = paragraphs.reduce((sum, n) => sum + n.values.year1, 0)
    const totalYear2 = paragraphs.reduce((sum, n) => sum + n.values.year2, 0)

    return {
      totalYear1,
      totalYear2,
      ministryCount: paragraphs.filter((n) => n.values.year1 !== 0 || n.values.year2 !== 0).length,
      accountCount: currentYearData.nodes.length,
      year1Label: currentYearData.year1Label,
      year2Label: currentYearData.year2Label,
    }
  }, [currentYearData])

  // Valg mellem bevilling og regnskab
  const [showBevilling, setShowBevilling] = useState(false) // Default: vis regnskab

  // Hjælpefunktion: find sum af regnskabskonto under en given node
  const findRegnskabskontoSum = useCallback((
    data: typeof currentYearData,
    parentCode: string,
    regnskabskontoCode: string,
    useYear1: boolean
  ): number => {
    if (!data) return 0

    let sum = 0
    for (const node of data.nodes) {
      // Find regnskabskonti der matcher filteret og tilhører parent
      if ((node.level === 'regnskabskonto' || node.level === 'regnskabskonto_detalje') &&
          node.code.startsWith(regnskabskontoCode)) {
        // Tjek om denne regnskabskonto tilhører den valgte parent
        // ID format: "${year}-${underkontoCode}-${code}"
        const idParts = node.id.split('-')
        if (idParts.length >= 2) {
          const underkontoCode = idParts[1]
          // Underkonto starter med parent-koden (fx "07110110" starter med "07")
          if (underkontoCode && underkontoCode.startsWith(parentCode)) {
            sum += useYear1 ? node.values.year1 : node.values.year2
          }
        }
      }
    }
    return sum
  }, [])

  // Tidsserie data for valgte elementer
  // Regnskabsdatabasen har bevilling (year1) og faktisk regnskab (year2) per år
  const timeSeriesData = useMemo(() => {
    if (compareItems.length === 0 || !allData.data) return []

    return compareItems.map(({ node, color }) => {
      const points: { year: number; value: number }[] = []

      // Saml data fra alle filer - hver fil = et år
      for (const [fileYear, data] of allData.data!) {
        let value: number

        if (regnskabskontoFilter) {
          // Hvis regnskabskonto-filter er aktivt, summer vi den specifikke konto under denne node
          value = findRegnskabskontoSum(data, node.code, regnskabskontoFilter, showBevilling)
        } else {
          // Ellers bruger vi nodens egen værdi
          const foundNode = data.index[node.code]
          if (!foundNode) continue
          value = showBevilling ? foundNode.values.year1 : foundNode.values.year2
        }

        points.push({
          year: fileYear,
          value,
        })
      }

      return {
        name: regnskabskontoFilter
          ? `${node.name} (${regnskabskontoFilter})`
          : node.name,
        code: node.code,
        color,
        points: points.sort((a, b) => a.year - b.year),
      }
    })
  }, [compareItems, allData.data, showBevilling, regnskabskontoFilter, findRegnskabskontoSum])

  // Tabeldata - afhænger af timeSeriesData
  const tableData = useMemo(() => {
    if (timeSeriesData.length === 0) return { years: [] as number[], rows: [] as { name: string; code: string; color: string; values: Record<number, number> }[] }

    const allYears = new Set<number>()
    for (const series of timeSeriesData) {
      for (const point of series.points) {
        allYears.add(point.year)
      }
    }
    const years = Array.from(allYears).sort((a, b) => a - b)

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
  }, [timeSeriesData])

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
    a.download = `regnskab-tidsserie-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [tableData])

  // Find alle regnskabskonti (2-cifrede, starter med 1-9)
  const availableRegnskabskonti = useMemo(() => {
    if (!currentYearData) return []

    const konti = new Map<string, string>()
    for (const node of currentYearData.nodes) {
      if (node.level === 'regnskabskonto') {
        if (!konti.has(node.code)) {
          konti.set(node.code, node.name)
        }
      }
    }

    return Array.from(konti.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [currentYearData])

  // Render en node rekursivt
  const renderNode = (node: RegnskabNode, depth: number) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const isInCompare = compareItems.some((item) => item.node.id === node.id)
    const compareItem = compareItems.find((item) => item.node.id === node.id)

    // Filter på niveau
    if (levelFilter && node.level !== levelFilter && !node.children.some(c => c.level === levelFilter)) {
      return null
    }

    // Filter på regnskabskonto - vis kun noder der indeholder den valgte regnskabskonto
    if (regnskabskontoFilter) {
      const hasMatchingRegnskabskonto = (n: RegnskabNode): boolean => {
        if ((n.level === 'regnskabskonto' || n.level === 'regnskabskonto_detalje') && n.code.startsWith(regnskabskontoFilter)) {
          return true
        }
        return n.children.some(hasMatchingRegnskabskonto)
      }
      if (!hasMatchingRegnskabskonto(node)) {
        return null
      }
    }

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
            isInCompare ? 'bg-gray-50 dark:bg-gray-700' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {/* Expand/collapse ikon */}
          {hasChildren ? (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <span className="w-4" />
          )}

          {/* Farve-indikator hvis i sammenligning */}
          {isInCompare && (
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: compareItem?.color }} />
          )}

          {/* Kode og navn */}
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{node.code}</span>
          <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">{node.name}</span>

          {/* Værdier */}
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {formatRegnskab(node.values.year1)} / {formatRegnskab(node.values.year2)}
          </span>

          {/* Tilføj-knap */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              addToCompare(node)
            }}
            className="p-1 text-gray-400 hover:text-ft-red transition-colors"
            title="Tilføj til sammenligning"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Børn */}
        {isExpanded && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Data fra Regnskabsdatabasen</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Udforsk statsregnskabet. Klik på + for at sammenligne konti.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* År-vælger */}
          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
          >
            {availableYears.data?.map((year) => (
              <option key={year} value={year}>
                Regnskab {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats kort */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatRegnskabCompact(stats.totalYear1)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total {stats.year1Label}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatRegnskabCompact(stats.totalYear2)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total {stats.year2Label}</div>
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
            <p className="text-gray-500 dark:text-gray-400">Indlæser regnskabsdata...</p>
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
          <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            {/* Søgefelt og filter */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Søg konto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2 mt-2">
                <select
                  value={levelFilter ?? ''}
                  onChange={(e) => setLevelFilter(e.target.value ? (e.target.value as HierarchyLevel) : null)}
                  className="flex-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5"
                >
                  <option value="">Alle niveauer</option>
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trævisning */}
            <div className="h-[500px] overflow-y-auto p-2">
              {filteredTree.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  {searchTerm.length >= 2 ? 'Ingen resultater fundet' : 'Indlæser regnskabsdata...'}
                </div>
              ) : (
                filteredTree.map((node) => renderNode(node, 0))
              )}
            </div>

            {/* År info */}
            {currentYearData && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                Viser: {currentYearData.year1Label} / {currentYearData.year2Label} (fra fil {selectedYear})
              </div>
            )}
          </div>

          {/* Højre panel: Tidsserie + tabel */}
          <div className="lg:col-span-7 space-y-6">
            {/* Valgte elementer */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Sammenligning ({compareItems.length}/{COMPARE_COLORS.length})
              </h3>

              {compareItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="mb-2">Vælg konti fra træet til venstre for at se tidsserie og tabel.</p>
                  <p className="text-sm">Klik på + ikonet ved en konto for at tilføje den til sammenligningen.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {compareItems.map(({ node, color }, index) => (
                    <div
                      key={node.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full"
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{node.name}</span>
                      <button
                        onClick={() => removeFromCompare(index)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stor tidsserie + tabel */}
            {compareItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tidsserie ({showBevilling ? 'Bevilling' : 'Regnskab'})
                    </h3>
                    {/* Bevilling/Regnskab-vælger */}
                    <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                      <button
                        onClick={() => setShowBevilling(true)}
                        className={`px-2 py-1 text-xs font-medium transition-colors ${
                          showBevilling
                            ? 'bg-ft-red text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        Bevilling
                      </button>
                      <button
                        onClick={() => setShowBevilling(false)}
                        className={`px-2 py-1 text-xs font-medium transition-colors ${
                          !showBevilling
                            ? 'bg-ft-red text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        Regnskab
                      </button>
                    </div>
                  </div>
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

                {/* Graf */}
                <div className="h-[280px]">
                  <RegnskabTimeSeriesChart data={timeSeriesData} />
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
                                {row.values[year] !== undefined ? formatRegnskabCompact(row.values[year]) : '-'}
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

            {/* Regnskabskonto filter */}
            {availableRegnskabskonti.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Regnskabskonto filter
                  </h3>
                  <select
                    value={regnskabskontoFilter ?? ''}
                    onChange={(e) => setRegnskabskontoFilter(e.target.value || null)}
                    className="text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                  >
                    <option value="">Alle regnskabskonti</option>
                    {availableRegnskabskonti.map((konto) => (
                      <option key={konto.code} value={konto.code}>
                        {konto.code} - {konto.name}
                      </option>
                    ))}
                  </select>
                </div>
                {regnskabskontoFilter && compareItems.length > 0 ? (
                  <p className="text-xs text-ft-red dark:text-red-400">
                    Tidsserien viser nu kun konto {regnskabskontoFilter} for de valgte områder.
                  </p>
                ) : regnskabskontoFilter ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Vælg områder fra træet for at se tidsserie for konto {regnskabskontoFilter}.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Vælg en regnskabskonto for at filtrere tidsserien til den specifikke udgiftstype.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Simpel tidsserie-graf for regnskab */
function RegnskabTimeSeriesChart({
  data,
}: {
  data: { name: string; code: string; color: string; points: { year: number; value: number }[] }[]
}) {
  if (data.length === 0 || data[0].points.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
        Ingen tidsserie-data tilgængelig
      </div>
    )
  }

  // Find alle år og min/max
  const allYears = [...new Set(data.flatMap((d) => d.points.map((p) => p.year)))].sort()
  const allValues = data.flatMap((d) => d.points.map((p) => p.value))
  const minVal = Math.min(0, ...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const width = 600
  const height = 260
  const padding = { top: 20, right: 20, bottom: 30, left: 60 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const xScale = (year: number) => {
    const minY = Math.min(...allYears)
    const maxY = Math.max(...allYears)
    return padding.left + ((year - minY) / (maxY - minY || 1)) * chartW
  }

  const yScale = (val: number) => {
    return padding.top + chartH - ((val - minVal) / range) * chartH
  }

  // Y-akse ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => minVal + pct * range)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
      {/* Grid */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={yScale(tick)}
            x2={width - padding.right}
            y2={yScale(tick)}
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-700"
          />
          <text
            x={padding.left - 8}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-[10px] fill-gray-500 dark:fill-gray-400"
          >
            {formatRegnskabCompact(tick)}
          </text>
        </g>
      ))}

      {/* X-akse */}
      {allYears.map((year) => (
        <text
          key={year}
          x={xScale(year)}
          y={height - 8}
          textAnchor="middle"
          className="text-[11px] fill-gray-600 dark:fill-gray-400"
        >
          {year}
        </text>
      ))}

      {/* Linjer */}
      {data.map((series) => {
        const pathD = series.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.year)} ${yScale(p.value)}`)
          .join(' ')

        return (
          <g key={series.code}>
            <path d={pathD} fill="none" stroke={series.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {series.points.map((p) => (
              <circle key={p.year} cx={xScale(p.year)} cy={yScale(p.value)} r={4} fill={series.color} stroke="white" strokeWidth={1.5} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
