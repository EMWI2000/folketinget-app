import { useState, useMemo, useEffect } from 'react'
import { useAllRegnskab, useAvailableRegnskabYears } from '../../hooks/useRegnskab'
import { findAgenciesWithAccounts, REGNSKABSKONTO_CATEGORIES, type AgencyWithAccounts } from '../../lib/regnskab/agencies'
import { formatRegnskabCompact, formatRegnskab } from '../../lib/regnskab/formatter'

interface SelectedAgency {
  agency: AgencyWithAccounts
  color: string
}

const COMPARE_COLORS = [
  '#a1172f', // ft-red
  '#2563eb', // blue-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
]

export default function StyrelseRegnskabContent() {
  const availableYears = useAvailableRegnskabYears()
  const allData = useAllRegnskab()

  // State
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAgencies, setSelectedAgencies] = useState<SelectedAgency[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'total' | 'ministry'>('total')
  const [showYear1, setShowYear1] = useState(true)
  const [kontoFilter, setKontoFilter] = useState<string | null>(null)
  const [showDetailLevel, setShowDetailLevel] = useState(false)

  // Sæt default år
  useEffect(() => {
    if (availableYears.data && availableYears.data.length > 0 && selectedYear === null) {
      setSelectedYear(Math.max(...availableYears.data))
    }
  }, [availableYears.data, selectedYear])

  // Nuværende data
  const currentYearData = selectedYear !== null ? allData.data?.get(selectedYear) : undefined

  // Find alle styrelser
  const agencies = useMemo(() => {
    if (!currentYearData) return []
    return findAgenciesWithAccounts(currentYearData)
  }, [currentYearData])

  // Filtreret og sorteret liste
  const filteredAgencies = useMemo(() => {
    let result = agencies

    if (searchTerm.length >= 2) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (a) =>
          a.agency.name.toLowerCase().includes(term) ||
          a.agency.code.includes(term) ||
          a.ministry?.name.toLowerCase().includes(term)
      )
    }

    const getValue = (a: AgencyWithAccounts) => showYear1 ? a.agency.values.year1 : a.agency.values.year2

    switch (sortBy) {
      case 'name':
        result = [...result].sort((a, b) => a.agency.name.localeCompare(b.agency.name, 'da'))
        break
      case 'total':
        result = [...result].sort((a, b) => Math.abs(getValue(b)) - Math.abs(getValue(a)))
        break
      case 'ministry':
        result = [...result].sort((a, b) => {
          const aMin = a.ministry?.name ?? ''
          const bMin = b.ministry?.name ?? ''
          return aMin.localeCompare(bMin, 'da')
        })
        break
    }

    return result
  }, [agencies, searchTerm, sortBy, showYear1])

  const toggleAgency = (agency: AgencyWithAccounts) => {
    setSelectedAgencies((prev) => {
      const exists = prev.find((s) => s.agency.agency.code === agency.agency.code)
      if (exists) {
        return prev.filter((s) => s.agency.agency.code !== agency.agency.code)
      }
      if (prev.length >= COMPARE_COLORS.length) {
        return prev
      }
      const color = COMPARE_COLORS[prev.length]
      return [...prev, { agency, color }]
    })
  }

  const isSelected = (agency: AgencyWithAccounts) =>
    selectedAgencies.some((s) => s.agency.agency.code === agency.agency.code)

  // Regnskabskonto aggregering (2-cifrede)
  const regnskabskontoComparison = useMemo(() => {
    if (selectedAgencies.length === 0) return []

    const codeToName = new Map<string, string>()
    for (const { agency } of selectedAgencies) {
      for (const konto of agency.regnskabskonti) {
        if (konto.code.length === 2) {
          if (!codeToName.has(konto.code)) {
            codeToName.set(konto.code, konto.name)
          }
        }
      }
    }

    return Array.from(codeToName.entries())
      .map(([code, dataName]) => {
        const values = selectedAgencies.map(({ agency, color }) => {
          const matchingKonti = agency.regnskabskonti.filter((k) => k.code === code)
          const totalYear1 = matchingKonti.reduce((sum, k) => sum + k.values.year1, 0)
          const totalYear2 = matchingKonti.reduce((sum, k) => sum + k.values.year2, 0)
          return { agencyName: agency.agency.name, color, valueYear1: totalYear1, valueYear2: totalYear2 }
        })
        const name = dataName || REGNSKABSKONTO_CATEGORIES[code] || `Regnskabskonto ${code}`
        return { code, name, values, isDetail: false }
      })
      .filter((row) => row.values.some((v) => v.valueYear1 !== 0 || v.valueYear2 !== 0))
      .sort((a, b) => {
        const aMax = Math.max(...a.values.map((v) => Math.abs(showYear1 ? v.valueYear1 : v.valueYear2)))
        const bMax = Math.max(...b.values.map((v) => Math.abs(showYear1 ? v.valueYear1 : v.valueYear2)))
        return bMax - aMax
      })
  }, [selectedAgencies, showYear1])

  // Regnskabskonto detaljer (4-cifrede)
  const regnskabskontoDetails = useMemo(() => {
    if (selectedAgencies.length === 0 || !kontoFilter) return []

    const codeToName = new Map<string, string>()
    for (const { agency } of selectedAgencies) {
      for (const konto of agency.regnskabskonti) {
        if (konto.code.length === 4 && konto.code.startsWith(kontoFilter)) {
          if (!codeToName.has(konto.code)) {
            codeToName.set(konto.code, konto.name)
          }
        }
      }
    }

    return Array.from(codeToName.entries())
      .map(([code, dataName]) => {
        const values = selectedAgencies.map(({ agency, color }) => {
          const matchingKonti = agency.regnskabskonti.filter((k) => k.code === code)
          const totalYear1 = matchingKonti.reduce((sum, k) => sum + k.values.year1, 0)
          const totalYear2 = matchingKonti.reduce((sum, k) => sum + k.values.year2, 0)
          return { agencyName: agency.agency.name, color, valueYear1: totalYear1, valueYear2: totalYear2 }
        })
        return { code, name: dataName, values, isDetail: true }
      })
      .filter((row) => row.values.some((v) => v.valueYear1 !== 0 || v.valueYear2 !== 0))
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [selectedAgencies, kontoFilter, showYear1])

  // Tidsserie data
  const timeSeriesData = useMemo(() => {
    if (selectedAgencies.length === 0 || !allData.data) return []

    return selectedAgencies.map(({ agency, color }) => {
      const points: { year: number; value: number; source: string }[] = []
      for (const [fileYear, data] of allData.data!) {
        const node = data.index[agency.agency.code]
        if (!node) continue
        points.push({
          year: fileYear,
          value: showYear1 ? node.values.year1 : node.values.year2,
          source: `${showYear1 ? 'Bevilling' : 'Regnskab'} ${fileYear}`,
        })
      }
      return { agency: agency.agency.name, color, points: points.sort((a, b) => a.year - b.year) }
    })
  }, [selectedAgencies, allData.data, showYear1])

  if (allData.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-ft-red border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Indlæser regnskabsdata...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Kontrolpanel */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          {/* Bevilling/Regnskab-vælger */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setShowYear1(true)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                showYear1
                  ? 'bg-ft-red text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Bevilling
            </button>
            <button
              onClick={() => setShowYear1(false)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                !showYear1
                  ? 'bg-ft-red text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Regnskab
            </button>
          </div>

          {/* År-vælger */}
          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
          >
            {availableYears.data?.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {agencies.length} styrelser fundet
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Venstre: Styrelsesliste */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Søg efter styrelse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
            <div className="flex gap-2 mt-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="flex-1 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
              >
                <option value="total">Sortér efter størrelse</option>
                <option value="name">Sortér efter navn</option>
                <option value="ministry">Sortér efter ministerium</option>
              </select>
            </div>
          </div>

          <div className="h-[400px] sm:h-[500px] overflow-y-auto">
            {filteredAgencies.map((agency) => {
              const selected = isSelected(agency)
              const selectedItem = selectedAgencies.find((s) => s.agency.agency.code === agency.agency.code)
              const displayValue = showYear1 ? agency.agency.values.year1 : agency.agency.values.year2

              return (
                <button
                  key={agency.agency.code}
                  onClick={() => toggleAgency(agency)}
                  className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selected ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${selected ? '' : 'bg-gray-300 dark:bg-gray-600'}`}
                      style={selected ? { backgroundColor: selectedItem?.color } : {}}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{agency.agency.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{agency.ministry?.name ?? 'Ukendt ministerium'}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-mono mt-1">{formatRegnskab(displayValue)} mio. kr.</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Højre: Visualiseringer */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {selectedAgencies.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p>Vælg styrelser fra listen til venstre for at sammenligne.</p>
            </div>
          ) : (
            <>
              {/* Valgte styrelser */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Valgte styrelser ({selectedAgencies.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgencies.map(({ agency, color }) => (
                    <div key={agency.agency.code} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{agency.agency.name}</span>
                      <button onClick={() => toggleAgency(agency)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total sammenligning */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Total ({showYear1 ? 'Bevilling' : 'Regnskab'} {selectedYear})</h3>
                <div className="space-y-3">
                  {[...selectedAgencies]
                    .sort((a, b) => {
                      const aVal = showYear1 ? a.agency.agency.values.year1 : a.agency.agency.values.year2
                      const bVal = showYear1 ? b.agency.agency.values.year1 : b.agency.agency.values.year2
                      return Math.abs(bVal) - Math.abs(aVal)
                    })
                    .map(({ agency, color }) => {
                      const maxValue = Math.max(...selectedAgencies.map((s) => Math.abs(showYear1 ? s.agency.agency.values.year1 : s.agency.agency.values.year2)))
                      const value = showYear1 ? agency.agency.values.year1 : agency.agency.values.year2
                      const width = (Math.abs(value) / maxValue) * 100

                      return (
                        <div key={agency.agency.code}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 dark:text-gray-300 truncate">{agency.agency.name}</span>
                            <span className="text-gray-600 dark:text-gray-400 font-mono ml-2">{formatRegnskab(value)} mio.</span>
                          </div>
                          <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                            <div className="h-full rounded transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Tidsserie */}
              {timeSeriesData.length > 0 && timeSeriesData[0].points.length > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Udvikling over tid ({showYear1 ? 'Bevilling' : 'Regnskab'})</h3>
                  <TimeSeriesChart data={timeSeriesData} />
                </div>
              )}

              {/* Regnskabskonto sammenligning */}
              {regnskabskontoComparison.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Regnskabskonto-sammenligning
                      <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">({showYear1 ? 'Bevilling' : 'Regnskab'} {selectedYear})</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={kontoFilter ?? ''}
                        onChange={(e) => { setKontoFilter(e.target.value || null); setShowDetailLevel(false) }}
                        className="text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                      >
                        <option value="">Alle hovedkonti (2-cifret)</option>
                        {regnskabskontoComparison.map((row) => (
                          <option key={row.code} value={row.code}>{row.code} - {row.name}</option>
                        ))}
                      </select>
                      {kontoFilter && regnskabskontoDetails.length > 0 && (
                        <button
                          onClick={() => setShowDetailLevel(!showDetailLevel)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            showDetailLevel
                              ? 'bg-ft-red text-white border-ft-red'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          Vis detaljer (4-cifret)
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 pr-4 pl-3 sm:pl-0 text-gray-600 dark:text-gray-400 font-medium">Regnskabskonto</th>
                          {selectedAgencies.map(({ agency, color }) => (
                            <th key={agency.agency.code} className="text-right py-2 px-2 font-medium">
                              <div className="flex items-center justify-end gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[80px]">{agency.agency.name.split(' ')[0]}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {regnskabskontoComparison
                          .filter((row) => !kontoFilter || row.code === kontoFilter)
                          .slice(0, kontoFilter ? 100 : 15)
                          .map((row) => (
                          <tr key={row.code} className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                            <td className="py-2 pr-4 pl-3 sm:pl-0">
                              <span className="text-gray-500 dark:text-gray-500 font-mono mr-2 font-semibold">{row.code}</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{row.name}</span>
                            </td>
                            {row.values.map((v, i) => {
                              const value = showYear1 ? v.valueYear1 : v.valueYear2
                              return (
                                <td key={i} className="text-right py-2 px-2 font-mono text-gray-600 dark:text-gray-400 font-semibold">
                                  {value !== 0 ? formatRegnskabCompact(value) : '-'}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                        {showDetailLevel && regnskabskontoDetails.map((row) => (
                          <tr key={row.code} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-2 pr-4 pl-6 sm:pl-4">
                              <span className="text-gray-400 dark:text-gray-500 font-mono mr-2">{row.code}</span>
                              <span className="text-gray-600 dark:text-gray-400">{row.name}</span>
                            </td>
                            {row.values.map((v, i) => {
                              const value = showYear1 ? v.valueYear1 : v.valueYear2
                              return (
                                <td key={i} className="text-right py-2 px-2 font-mono text-gray-500 dark:text-gray-500">
                                  {value !== 0 ? formatRegnskabCompact(value) : '-'}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!kontoFilter && regnskabskontoComparison.length > 15 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Viser top 15 af {regnskabskontoComparison.length} regnskabskonti. Vælg en hovedkonto for at se detaljer.</p>
                  )}
                  {kontoFilter && regnskabskontoDetails.length > 0 && !showDetailLevel && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{regnskabskontoDetails.length} detaljerede underkonti tilgængelige. Klik "Vis detaljer" for at se dem.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TimeSeriesChart({ data }: { data: { agency: string; color: string; points: { year: number; value: number; source: string }[] }[] }) {
  const allYears = [...new Set(data.flatMap((d) => d.points.map((p) => p.year)))].sort()
  const allValues = data.flatMap((d) => d.points.map((p) => p.value))
  const minVal = Math.min(0, ...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const width = 400
  const height = 180
  const padding = { top: 20, right: 20, bottom: 30, left: 60 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const xScale = (year: number) => {
    const minY = Math.min(...allYears)
    const maxY = Math.max(...allYears)
    return padding.left + ((year - minY) / (maxY - minY || 1)) * chartW
  }

  const yScale = (val: number) => padding.top + chartH - ((val - minVal) / range) * chartH

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const val = minVal + pct * range
        return (
          <g key={pct}>
            <line x1={padding.left} y1={yScale(val)} x2={width - padding.right} y2={yScale(val)} stroke="currentColor" className="text-gray-100 dark:text-gray-700" />
            <text x={padding.left - 8} y={yScale(val)} textAnchor="end" dominantBaseline="middle" className="text-[10px] fill-gray-500 dark:fill-gray-400">{formatRegnskabCompact(val)}</text>
          </g>
        )
      })}
      {allYears.map((year) => (
        <text key={year} x={xScale(year)} y={height - 8} textAnchor="middle" className="text-[11px] fill-gray-600 dark:fill-gray-400">{year}</text>
      ))}
      {data.map((series) => {
        const pathD = series.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.year)} ${yScale(p.value)}`).join(' ')
        return (
          <g key={series.agency}>
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
