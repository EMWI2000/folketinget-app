import { useState, useMemo } from 'react'
import { useLoendata } from '../hooks/useLoendata'
import { filtrerData, beregnBenchmark, beregnBenchmarkPerPeriode, tomFilter } from '../lib/loendata/parser'
import type { LoenFilter as LoenFilterType } from '../lib/loendata/types'
import { COMPARE_COLORS } from '../lib/loendata/types'
import LoenFilter from '../components/loendata/LoenFilter'
import BenchmarkTabel from '../components/loendata/BenchmarkTabel'
import LoenBarChart from '../components/loendata/LoenBarChart'
import LoenTidsserie from '../components/loendata/LoenTidsserie'
import LoenKomponentChart from '../components/loendata/LoenKomponentChart'

export default function Loendata() {
  const { data: rawData, isLoading, error } = useLoendata()
  const [filter, setFilter] = useState<LoenFilterType>(tomFilter)
  const [selectedNavne, setSelectedNavne] = useState<string[]>([])
  const [metric, setMetric] = useState<'samletLon' | 'aarsvaerk'>('samletLon')

  // Filtreret data
  const filtreret = useMemo(() => {
    if (!rawData) return []
    return filtrerData(rawData, filter)
  }, [rawData, filter])

  // Benchmark (aggregeret per hovedkonto)
  const benchmark = useMemo(() => beregnBenchmark(filtreret), [filtreret])

  // Benchmark per periode (til tidsserier)
  const benchmarkPerPeriode = useMemo(() => beregnBenchmarkPerPeriode(filtreret), [filtreret])

  // Ryd selection når benchmark ændres (fjern navne der ikke længere er i data)
  const validSelected = useMemo(
    () => selectedNavne.filter((n) => benchmark.some((b) => b.navn === n)),
    [selectedNavne, benchmark]
  )

  const toggleSelect = (navn: string) => {
    setSelectedNavne((prev) => {
      if (prev.includes(navn)) {
        return prev.filter((n) => n !== navn)
      }
      if (prev.length >= COMPARE_COLORS.length) return prev
      return [...prev, navn]
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-ft-red border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Indlæser løndata...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl p-6">
        Kunne ikke hente løndata. Prøv igen senere.
      </div>
    )
  }

  if (!rawData) return null

  const totalAarsvaerk = filtreret.reduce((s, r) => s + r.aarsvaerk, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Lønoverblik – staten
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gennemsnitslønninger i staten fordelt på hovedkonto, stilling og personalekategori.
          Data fra Moderniseringsstyrelsens lønoverblik.
        </p>
      </div>

      {/* Filter */}
      <LoenFilter data={rawData} filter={filter} onChange={setFilter} />

      {/* Statistik-kort */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-6">
        <StatKort label="Rækker" value={filtreret.length.toLocaleString('da-DK')} />
        <StatKort label="Hovedkonti" value={benchmark.length.toString()} />
        <StatKort
          label="Årsværk i alt"
          value={new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(totalAarsvaerk)}
        />
        <StatKort label="Valgt til benchmark" value={`${validSelected.length} / ${COMPARE_COLORS.length}`} />
      </div>

      {/* Benchmark tabel */}
      <BenchmarkTabel
        data={benchmark}
        selectedNavne={validSelected}
        onToggleSelect={toggleSelect}
      />

      {/* Visualiseringer for valgte */}
      {validSelected.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Valgte chips */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Valgte til sammenligning ({validSelected.length})
              </h3>
              <button
                onClick={() => setSelectedNavne([])}
                className="text-xs text-ft-red hover:underline"
              >
                Ryd alle
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {validSelected.map((navn, idx) => {
                const color = COMPARE_COLORS[idx % COMPARE_COLORS.length]
                const label = navn.replace(/^§[\d.]+\s*-\s*/, '')
                return (
                  <div
                    key={navn}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full"
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                      {label}
                    </span>
                    <button
                      onClick={() => toggleSelect(navn)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Metric toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setMetric('samletLon')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                metric === 'samletLon'
                  ? 'bg-white dark:bg-gray-700 text-ft-red shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Samlet løn
            </button>
            <button
              onClick={() => setMetric('aarsvaerk')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                metric === 'aarsvaerk'
                  ? 'bg-white dark:bg-gray-700 text-ft-red shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Årsværk
            </button>
          </div>

          {/* Bar chart */}
          <LoenBarChart data={benchmark} selectedNavne={validSelected} metric={metric} />

          {/* Tidsserie */}
          <LoenTidsserie
            benchmarkPerPeriode={benchmarkPerPeriode}
            selectedNavne={validSelected}
            metric={metric}
          />

          {/* Lønkomponent-nedbrydning */}
          <LoenKomponentChart data={benchmark} selectedNavne={validSelected} />
        </div>
      )}
    </div>
  )
}

function StatKort({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">{value}</div>
    </div>
  )
}
