import { useState, useMemo } from 'react'
import { useLoendata } from '../hooks/useLoendata'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import {
  filtrerData,
  beregnBenchmark,
  beregnBenchmarkPerPeriode,
  tomFilter,
  hentUnikke,
  sorterPerioder,
  formatLoen,
  formatAarsvaerk,
} from '../lib/loendata/parser'
import type { LoenFilter, BenchmarkRaekke, TabelfordelingId } from '../lib/loendata/types'
import { COMPARE_COLORS, TABELFORDELINGER } from '../lib/loendata/types'
import MultiSelect from '../components/loendata/MultiSelect'
import LoenBarChart from '../components/loendata/LoenBarChart'
import LoenTidsserie from '../components/loendata/LoenTidsserie'
import LoenKomponentChart from '../components/loendata/LoenKomponentChart'

export default function Loendata() {
  useDocumentTitle('Løndata')
  const [tabelfordeling, setTabelfordeling] = useState<TabelfordelingId>('pkat')
  const { data: rawData, isLoading, error } = useLoendata(tabelfordeling)

  const aktivTabelfordeling = TABELFORDELINGER.find((t) => t.id === tabelfordeling)!
  const harDim = (dim: string) => aktivTabelfordeling.dimensioner.includes(dim as never)

  // Datafiltre
  const [filter, setFilter] = useState<LoenFilter>(tomFilter)

  // Benchmark-selection
  const [selectedNavne, setSelectedNavne] = useState<string[]>([])
  const [metric, setMetric] = useState<'samletLon' | 'aarsvaerk'>('samletLon')

  // Søgning + udfoldet ministerområder
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedMin, setExpandedMin] = useState<Set<string>>(new Set())

  // Filtervalg fra rådata
  const perioder = useMemo(
    () => (rawData ? sorterPerioder(hentUnikke(rawData, 'periode')) : []),
    [rawData]
  )
  const personalekategorier = useMemo(
    () => (rawData && harDim('personalekategori') ? hentUnikke(rawData, 'personalekategori') : []),
    [rawData, tabelfordeling] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const stillinger = useMemo(
    () => (rawData && harDim('stilling') ? hentUnikke(rawData, 'stilling') : []),
    [rawData, tabelfordeling] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const loentrin = useMemo(
    () => (rawData && harDim('loentrin') ? hentUnikke(rawData, 'loentrin') : []),
    [rawData, tabelfordeling] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const klasser = useMemo(
    () => (rawData && harDim('klasse') ? hentUnikke(rawData, 'klasse') : []),
    [rawData, tabelfordeling] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const update = (partial: Partial<LoenFilter>) => setFilter((f) => ({ ...f, ...partial }))

  // Default til seneste periode når data indlæses — setState under render (uden effekt)
  const [prevPerioder, setPrevPerioder] = useState(perioder)
  if (perioder !== prevPerioder) {
    setPrevPerioder(perioder)
    if (perioder.length > 0 && filter.perioder.length === 0) {
      const seneste = perioder[perioder.length - 1]
      setFilter((f) => ({ ...f, perioder: [seneste] }))
    }
  }

  // Ryd irrelevante filtre ved skift af tabelfordeling — setState under render (uden effekt)
  const [prevTabelfordeling, setPrevTabelfordeling] = useState(tabelfordeling)
  if (tabelfordeling !== prevTabelfordeling) {
    setPrevTabelfordeling(tabelfordeling)
    setFilter((f) => ({
      ...f,
      personalekategorier: harDim('personalekategori') ? f.personalekategorier : [],
      stillinger: harDim('stilling') ? f.stillinger : [],
      loentrin: harDim('loentrin') ? f.loentrin : [],
      klasser: harDim('klasse') ? f.klasser : [],
    }))
  }

  // Filtreret data (alle filtre UNDTAGEN hovedkonto/ministerområde/type)
  const filtreret = useMemo(() => {
    if (!rawData) return []
    return filtrerData(rawData, {
      perioder: filter.perioder,
      ministeromraader: [],
      hovedkonti: [],
      typer: [],
      personalekategorier: filter.personalekategorier,
      stillinger: filter.stillinger,
      loentrin: filter.loentrin,
      klasser: filter.klasser,
    })
  }, [rawData, filter.perioder, filter.personalekategorier, filter.stillinger, filter.loentrin, filter.klasser])

  // Alle hovedkonti med benchmark-tal
  const alleBenchmark = useMemo(() => beregnBenchmark(filtreret), [filtreret])

  // Benchmark per periode (til tidsserier) – brug ALLE perioder
  const benchmarkPerPeriode = useMemo(() => {
    if (selectedNavne.length === 0 || !rawData) return []
    const dataUdenPeriodeFilter = filtrerData(rawData, {
      perioder: [],
      ministeromraader: [],
      hovedkonti: [],
      typer: [],
      personalekategorier: filter.personalekategorier,
      stillinger: filter.stillinger,
      loentrin: filter.loentrin,
      klasser: filter.klasser,
    })
    const relevant = dataUdenPeriodeFilter.filter((r) => selectedNavne.includes(r.hovedkonto))
    return beregnBenchmarkPerPeriode(relevant)
  }, [rawData, selectedNavne, filter.personalekategorier, filter.stillinger, filter.loentrin, filter.klasser])

  // Gruppér benchmark efter ministerområde (hierarkisk træ)
  const treeData = useMemo(() => {
    const map = new Map<string, BenchmarkRaekke[]>()
    for (const b of alleBenchmark) {
      if (!map.has(b.ministeromraade)) map.set(b.ministeromraade, [])
      map.get(b.ministeromraade)!.push(b)
    }
    for (const [, list] of map) {
      list.sort((a, b) => b.aarsvaerk - a.aarsvaerk)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'da'))
  }, [alleBenchmark])

  // Filtrér træ efter søgetekst
  const filteredTree = useMemo(() => {
    if (searchTerm.length < 2) return treeData
    const term = searchTerm.toLowerCase()
    const result: [string, BenchmarkRaekke[]][] = []
    for (const [min, konti] of treeData) {
      const minMatch = min.toLowerCase().includes(term)
      const matchingKonti = konti.filter(
        (k) => k.navn.toLowerCase().includes(term) || k.type.toLowerCase().includes(term)
      )
      if (minMatch || matchingKonti.length > 0) {
        result.push([min, minMatch ? konti : matchingKonti])
      }
    }
    return result
  }, [treeData, searchTerm])

  // Auto-fold ved søgning
  const effectiveExpanded = useMemo(() => {
    if (searchTerm.length >= 2) {
      return new Set(filteredTree.map(([min]) => min))
    }
    return expandedMin
  }, [searchTerm, filteredTree, expandedMin])

  const toggleExpand = (min: string) => {
    setExpandedMin((prev) => {
      const next = new Set(prev)
      if (next.has(min)) next.delete(min)
      else next.add(min)
      return next
    })
  }

  // Valide selections
  const validSelected = useMemo(
    () => selectedNavne.filter((n) => alleBenchmark.some((b) => b.navn === n)),
    [selectedNavne, alleBenchmark]
  )
  const selectedBenchmark = useMemo(
    () => alleBenchmark.filter((b) => validSelected.includes(b.navn)),
    [alleBenchmark, validSelected]
  )

  const toggleSelect = (navn: string) => {
    setSelectedNavne((prev) => {
      if (prev.includes(navn)) return prev.filter((n) => n !== navn)
      if (prev.length >= COMPARE_COLORS.length) return prev
      return [...prev, navn]
    })
  }

  const isSelected = (navn: string) => validSelected.includes(navn)

  const dimensionFilterCount =
    filter.personalekategorier.length +
    filter.stillinger.length +
    filter.loentrin.length +
    filter.klasser.length

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

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Lønoverblik – staten
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Vælg hovedkonti fra listen og sammenlign lønninger.
          Data fra{' '}
          <a
            href="https://loenoverblik.dk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ft-red"
          >
            Moderniseringsstyrelsens lønoverblik
          </a>
          .
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 sm:p-4 mb-4 text-sm text-amber-800 dark:text-amber-300">
        <details>
          <summary className="font-medium cursor-pointer select-none">
            Om data og forbehold
          </summary>
          <div className="mt-2 space-y-2 text-amber-700 dark:text-amber-400">
            <p>
              Data stammer fra Moderniseringsstyrelsens lønoverblik (loenoverblik.dk) og
              viser gennemsnitsløn pr. årsværk fordelt på lønkomponenter for statslige
              hovedkonti.
            </p>
            <p>
              <strong>Anonymiseringsgrænse:</strong> Grupper med under 3 årsværk er udeladt
              af hensyn til anonymisering. Det betyder, at jo mere detaljeret en
              tabelfordeling er (f.eks. personalekategori + stilling + løntrin), desto flere
              små grupper falder under grænsen, og desto flere årsværk mangler i totalen.
              Vælg en lavere detaljegrad (f.eks. kun &quot;Personalekategori&quot;) for mere
              komplette tal.
            </p>
            <p>
              <strong>Løntal er gennemsnit:</strong> Alle lønbeløb er vægtet gennemsnit pr.
              årsværk og kan ikke summeres direkte. Ved sammenligning af hovedkonti beregnes
              det vægtede gennemsnit: <span className="font-mono text-xs">&#931;(løn &times; årsværk) / &#931;(årsværk)</span>.
            </p>
            <p>
              <strong>Perioder:</strong> Data opdateres kvartalsvist. Ikke alle perioder er
              tilgængelige for alle tabelfordelinger.
            </p>
          </div>
        </details>
      </div>

      {/* Tabelfordeling + Datafiltre */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4 mb-4">
        {/* Tabelfordeling */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Tabelfordeling
            <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
              (detaljegrad — lavere detalje = mere komplet data)
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TABELFORDELINGER.map((t) => (
              <button
                key={t.id}
                onClick={() => setTabelfordeling(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tabelfordeling === t.id
                    ? 'bg-ft-red text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Periode pills */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Periode
          </label>
          <div className="flex flex-wrap gap-1.5">
            {perioder.map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (filter.perioder.includes(p)) {
                    update({ perioder: filter.perioder.filter((x) => x !== p) })
                  } else {
                    update({ perioder: [...filter.perioder, p] })
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter.perioder.includes(p)
                    ? 'bg-ft-red text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension-filtre (kun dem der er relevante for tabelfordelingen) */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Dimensionsfiltre
          </h3>
          {dimensionFilterCount > 0 && (
            <button
              onClick={() =>
                setFilter((f) => ({
                  ...f,
                  personalekategorier: [],
                  stillinger: [],
                  loentrin: [],
                  klasser: [],
                }))
              }
              className="text-xs text-ft-red hover:underline"
            >
              Ryd ({dimensionFilterCount})
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {harDim('personalekategori') && (
            <MultiSelect
              label="Personalekategori"
              options={personalekategorier}
              selected={filter.personalekategorier}
              onChange={(v) => update({ personalekategorier: v })}
              placeholder="Alle kategorier"
            />
          )}
          {harDim('stilling') && (
            <MultiSelect
              label="Stilling"
              options={stillinger}
              selected={filter.stillinger}
              onChange={(v) => update({ stillinger: v })}
              placeholder="Alle stillinger"
            />
          )}
          {harDim('klasse') && (
            <MultiSelect
              label="Klasse/Lønramme"
              options={klasser}
              selected={filter.klasser}
              onChange={(v) => update({ klasser: v })}
              placeholder="Alle klasser"
            />
          )}
          {harDim('loentrin') && (
            <MultiSelect
              label="Løntrin"
              options={loentrin}
              selected={filter.loentrin}
              onChange={(v) => update({ loentrin: v })}
              placeholder="Alle løntrin"
            />
          )}
        </div>
      </div>

      {/* Hoved-layout: Liste (venstre) + Benchmark (højre) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* VENSTRE: Hierarkisk ministerområde → hovedkonto-træ */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          {/* Søgefelt */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Søg efter hovedkonto, ministerium..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredTree.length} ministerområder · {filteredTree.reduce((s, [, k]) => s + k.length, 0)} hovedkonti
              </span>
              {expandedMin.size > 0 && searchTerm.length < 2 && (
                <button
                  onClick={() => setExpandedMin(new Set())}
                  className="text-xs text-ft-red hover:underline"
                >
                  Luk alle
                </button>
              )}
            </div>
          </div>

          {/* Træ-liste */}
          <div className="h-[450px] sm:h-[550px] overflow-y-auto">
            {filteredTree.map(([min, konti]) => {
              const isExpanded = effectiveExpanded.has(min)
              const minLabel = min.replace(/^§\d+\s*-\s*/, '')
              const selectedCount = konti.filter((k) => isSelected(k.navn)).length
              const totalAv = konti.reduce((s, k) => s + k.aarsvaerk, 0)

              return (
                <div key={min}>
                  <button
                    onClick={() => toggleExpand(min)}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors sticky top-0 z-10"
                  >
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {minLabel}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {konti.length} hovedkonti · {formatAarsvaerk(totalAv)} åv
                        {selectedCount > 0 && (
                          <span className="ml-1 text-ft-red font-medium">
                            · {selectedCount} valgt
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded &&
                    konti.map((row) => {
                      const selected = isSelected(row.navn)
                      const idx = validSelected.indexOf(row.navn)
                      const color =
                        idx >= 0 ? COMPARE_COLORS[idx % COMPARE_COLORS.length] : undefined
                      const label = row.navn.replace(/^§[\d.]+\s*-\s*/, '')

                      return (
                        <button
                          key={row.navn}
                          onClick={() => toggleSelect(row.navn)}
                          className={`w-full text-left pl-9 pr-3 py-2 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${
                            selected ? 'bg-ft-red/5 dark:bg-ft-red/10' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${
                                selected ? '' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                              style={selected ? { backgroundColor: color } : {}}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                {label}
                              </div>
                              <div className="flex gap-3 mt-0.5">
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {row.type}
                                </span>
                                <span className="text-[11px] text-gray-600 dark:text-gray-300 font-mono">
                                  {formatAarsvaerk(row.aarsvaerk)} åv
                                </span>
                                <span className="text-[11px] text-gray-600 dark:text-gray-300 font-mono">
                                  {formatLoen(row.samletLon)} kr.
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                </div>
              )
            })}

            {filteredTree.length === 0 && (
              <div className="p-4 text-sm text-gray-400 dark:text-gray-500 text-center">
                Ingen resultater for &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>

        {/* HØJRE: Benchmark-visualiseringer */}
        <div className="lg:col-span-8 space-y-4">
          {validSelected.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="font-medium mb-1">Vælg hovedkonti fra listen</p>
              <p className="text-sm">
                Klik på en eller flere hovedkonti til venstre for at sammenligne lønninger.
              </p>
            </div>
          ) : (
            <>
              {/* Valgte chips */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Valgte ({validSelected.length})
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
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                          {label}
                        </span>
                        <button
                          onClick={() => toggleSelect(navn)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Nøgletal-tabel */}
              <BenchmarkMiniTabel data={selectedBenchmark} selected={validSelected} />

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
              <LoenBarChart data={alleBenchmark} selectedNavne={validSelected} metric={metric} />

              {/* Tidsserie */}
              <LoenTidsserie
                benchmarkPerPeriode={benchmarkPerPeriode}
                selectedNavne={validSelected}
                metric={metric}
              />

              {/* Lønkomponent-nedbrydning */}
              <LoenKomponentChart data={alleBenchmark} selectedNavne={validSelected} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Kompakt benchmark-tabel for de valgte hovedkonti */
function BenchmarkMiniTabel({
  data,
  selected,
}: {
  data: BenchmarkRaekke[]
  selected: string[]
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs">
              <th className="text-left py-2 pl-4 pr-2 font-medium text-gray-600 dark:text-gray-400">
                Hovedkonto
              </th>
              <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                Årsværk
              </th>
              <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                Samlet løn
              </th>
              <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                Basisløn
              </th>
              <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                Pension
              </th>
              <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                Centr. tillæg
              </th>
              <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                Lok. faste
              </th>
              <th className="text-right py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">
                Lok. midl.
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const idx = selected.indexOf(row.navn)
              const color = COMPARE_COLORS[idx % COMPARE_COLORS.length]
              const label = row.navn.replace(/^§[\d.]+\s*-\s*/, '')

              return (
                <tr
                  key={row.navn}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="py-2 pl-4 pr-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-gray-900 dark:text-white text-xs truncate max-w-[160px]">
                        {label}
                      </span>
                    </div>
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
                  <td className="py-2 pr-4 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatLoen(row.midlertLokale)}
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
