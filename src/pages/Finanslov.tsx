import { useState, useCallback, useMemo } from 'react'
import { useAllFinanslov, useFinanslovSearch } from '../hooks/useFinanslov'
import type { BudgetNode, CompareItem, HierarchyLevel } from '../lib/finanslov/types'
import { COMPARE_COLORS } from '../lib/finanslov/types'
import { exportComparisonCSV, exportYearCSV } from '../lib/finanslov/export'
import BudgetTree from '../components/finanslov/BudgetTree'
import CompareCanvas from '../components/finanslov/CompareCanvas'
import LineChart from '../components/finanslov/LineChart'
import BudgetBar from '../components/finanslov/BudgetBar'
import Treemap from '../components/finanslov/Treemap'

export default function Finanslov() {
  // Hent alle tre års data
  const allData = useAllFinanslov()

  // UI state
  const [selectedYear, setSelectedYear] = useState<2024 | 2025 | 2026>(2026)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<HierarchyLevel | null>(null)
  const [compareItems, setCompareItems] = useState<CompareItem[]>([])

  // Nuværende års data
  const currentYearData = allData.data?.get(selectedYear)

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

  // Tilføj fra treemap-klik
  const handleTreemapSelect = useCallback(
    (node: BudgetNode) => {
      handleAddCompareItem(node)
    },
    [handleAddCompareItem]
  )

  // Eksport
  const handleExportComparison = useCallback(() => {
    if (compareItems.length > 0) {
      exportComparisonCSV(compareItems.map((item) => item.node))
    }
  }, [compareItems])

  const handleExportYear = useCallback(() => {
    if (currentYearData) {
      exportYearCSV(currentYearData.nodes, selectedYear)
    }
  }, [currentYearData, selectedYear])

  // Stats
  const stats = useMemo(() => {
    if (!currentYearData) return null

    const paragraphs = currentYearData.tree.filter((n) => n.level === 'paragraf')
    const totalF = paragraphs.reduce((sum, n) => sum + n.values.F, 0)
    const totalPositive = paragraphs.filter((n) => n.values.F > 0).reduce((sum, n) => sum + n.values.F, 0)
    const totalNegative = paragraphs.filter((n) => n.values.F < 0).reduce((sum, n) => sum + n.values.F, 0)

    return {
      totalF,
      totalPositive,
      totalNegative,
      ministryCount: paragraphs.filter((n) => n.values.F !== 0).length,
      accountCount: currentYearData.nodes.length,
    }
  }, [currentYearData])

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Finansloven</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Udforsk det danske statsbudget. Træk konti til højre for at sammenligne.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* År-vælger */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value) as 2024 | 2025 | 2026)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
          >
            <option value={2024}>FL 2024</option>
            <option value={2025}>FL 2025</option>
            <option value={2026}>FL 2026</option>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 min-h-[200px]">
              <CompareCanvas
                items={compareItems}
                onAddItem={handleAddCompareItem}
                onRemoveItem={handleRemoveCompareItem}
                allData={allData.data}
              />
            </div>

            {/* Visualiseringer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Linjediagram */}
              <LineChart
                items={compareItems}
                allData={allData.data ?? new Map()}
                valueKey="F"
                title="Bevilling over tid (F)"
              />

              {/* Søjlediagram */}
              <BudgetBar items={compareItems} valueKey="F" title="Sammenligning" />
            </div>

            {/* Treemap */}
            <Treemap data={currentYearData} onSelectNode={handleTreemapSelect} />
          </div>
        </div>
      )}
    </div>
  )
}
