import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePerioder, useAktstykker, useAktstykkePdfUrls } from '../hooks/useAktstykker'
import type { Sag } from '../types/ft'
import StatKort from '../components/StatKort'
import PeriodeSelect, { useDefaultPeriode } from '../components/PeriodeSelect'
import AktsTidslinje from '../components/AktsTidslinje'
import AiSammenfatning from '../components/AiSammenfatning'
import CopyButton from '../components/CopyButton'
import { aktstykkerToCsv, downloadCsv } from '../lib/csv'

function formatDato(dato: string): string {
  return new Date(dato).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getAfgørelsesBadge(kode: string | null) {
  switch (kode) {
    case 'TU':
      return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Tiltrådt enstemmigt</span>
    case 'TF':
      return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Tiltrådt med flertal</span>
    case 'IK':
      return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Ikke tiltrådt</span>
    default:
      return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Under behandling</span>
  }
}

function MinisteriumSektion({ ministerium, sager, pdfUrls }: { ministerium: string; sager: Sag[]; pdfUrls: Record<number, string | null> }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ft-red/10 rounded-lg flex items-center justify-center text-ft-red text-sm font-bold">
            §
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{ministerium}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{sager.length} aktstykke{sager.length !== 1 ? 'r' : ''}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {sager.map((sag) => {
            const pdfUrl = pdfUrls[sag.id] || aktstykkePdfUrl(sag)
            return (
              <div
                key={sag.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0 group"
              >
                <Link to={`/sag/${sag.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-ft-red">{sag.nummer}</span>
                    <CopyButton text={sag.nummer || sag.nummerprefix} label="sagsnummer" />
                    {getAfgørelsesBadge(sag.afgørelsesresultatkode)}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-ft-red transition-colors truncate">
                    {sag.titelkort || sag.titel}
                  </p>
                </Link>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-ft-red transition-colors"
                      title="Se aktstykke (PDF)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDato(sag.opdateringsdato)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function aktstykkePdfUrl(sag: Sag): string | null {
  if (!sag.nummerprefix || !sag.nummernumerisk || !sag.periodeid) return null
  return `https://www.ft.dk/samling/${sag.periodeid}/aktstykke/${sag.nummerprefix.toLowerCase()}${sag.nummernumerisk}/index.htm`
}

export default function Aktstykker() {
  const perioder = usePerioder()
  const defaultPeriode = useDefaultPeriode(perioder.data)

  const [selectedPeriode, setSelectedPeriode] = useState<number | null>(null)
  const aktivPeriode = selectedPeriode ?? defaultPeriode

  const aktstykker = useAktstykker(aktivPeriode)
  const pdfUrls = useAktstykkePdfUrls(aktstykker.data?.value)

  // Filtre
  const [search, setSearch] = useState('')
  const [selectedMinisterium, setSelectedMinisterium] = useState<string | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)

  // Gruppér og filtrer
  const { grouped, ministerier, stats, allFiltered } = useMemo(() => {
    const sager = aktstykker.data?.value ?? []

    // Filtrer
    const filtered = sager.filter((s) => {
      if (search && !s.titel.toLowerCase().includes(search.toLowerCase()) && !s.titelkort?.toLowerCase().includes(search.toLowerCase())) return false
      if (selectedMinisterium && s.paragraf !== selectedMinisterium) return false
      return true
    })

    // Gruppér efter ministerium
    const groups = new Map<string, Sag[]>()
    for (const sag of filtered) {
      const key = sag.paragraf || 'Ukendt ministerium'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(sag)
    }

    // Sortér grupper efter antal (faldende)
    const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)

    // Unikke ministerier (for dropdown)
    const allMinisterier = [...new Set(sager.map((s) => s.paragraf).filter(Boolean))] as string[]
    allMinisterier.sort()

    // Stats
    const godkendte = sager.filter((s) => s.afgørelsesresultatkode === 'TU' || s.afgørelsesresultatkode === 'TF').length

    return {
      grouped: sorted,
      ministerier: allMinisterier,
      allFiltered: filtered,
      stats: {
        total: sager.length,
        godkendte,
        underBehandling: sager.length - godkendte,
        ministerier: allMinisterier.length,
      },
    }
  }, [aktstykker.data, search, selectedMinisterium])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Aktstykker</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">Finansudvalgets bevillinger grupperet efter ministerium</p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-900 dark:text-amber-200">
          <p className="mb-2">
            <strong>Hvad er aktstykker?</strong> Aktstykker er bevillingsanmodninger fra ministerierne til Folketingets Finansudvalg. Når et ministerium har brug for ekstra bevillinger eller vil omdisponere midler, fremsender de et aktstykke. Finansudvalget godkender (tiltræder) eller afviser dem.
          </p>
          <p className="mb-2">
            <strong>Statuskoder:</strong> <span className="inline-flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium">TU</span> = Tiltrådt enstemmigt</span> · <span className="inline-flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">TF</span> = Tiltrådt med flertal</span> · <span className="inline-flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">IK</span> = Ikke tiltrådt</span>
          </p>
          <p className="text-amber-700 dark:text-amber-300">Beløb og bevillingsdetaljer fremgår af selve aktstykke-dokumentet (PDF). Klik på link-ikonet for at åbne dokumentet.</p>
        </div>
      </div>

      {/* Filter-bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <PeriodeSelect
          perioder={perioder.data}
          value={aktivPeriode}
          onChange={setSelectedPeriode}
        />
        <select
          value={selectedMinisterium ?? ''}
          onChange={(e) => setSelectedMinisterium(e.target.value || null)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ft-red/30"
        >
          <option value="">Alle ministerier</option>
          {ministerier.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg i aktstykker..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ft-red/30"
          />
        </div>
      </div>

      {/* Action-knapper */}
      <div className="flex flex-wrap gap-3 mb-6">
        {pdfUrls.data && Object.values(pdfUrls.data).some(Boolean) && (
          <button
            onClick={() => {
              const filteredIds = grouped.flatMap(([, sager]) => sager.map(s => s.id))
              const urls = filteredIds
                .map(id => pdfUrls.data![id])
                .filter((url): url is string => !!url)
                .slice(0, 10)
              urls.forEach(url => window.open(url, '_blank'))
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ft-red text-white rounded-lg hover:bg-ft-red-dark transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Åbn alle PDF'er (maks 10)
          </button>
        )}
        {allFiltered.length > 0 && (
          <button
            onClick={() => downloadCsv(aktstykkerToCsv(allFiltered), 'aktstykker.csv')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Eksportér CSV
          </button>
        )}
        <button
          onClick={() => setShowAiPanel(!showAiPanel)}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
            showAiPanel
              ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Søg i tekst
        </button>
      </div>

      {/* AI panel */}
      {showAiPanel && (
        <div className="mb-6">
          <AiSammenfatning />
        </div>
      )}

      {/* Stat-kort */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatKort
          label="Aktstykker"
          value={stats.total}
          loading={aktstykker.isLoading}
          color="red"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatKort
          label="Godkendte"
          value={stats.godkendte}
          loading={aktstykker.isLoading}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
        />
        <StatKort
          label="Under behandling"
          value={stats.underBehandling}
          loading={aktstykker.isLoading}
          color="amber"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatKort
          label="Ministerier"
          value={stats.ministerier}
          loading={aktstykker.isLoading}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
      </div>

      {/* Tidslinje */}
      {aktstykker.data && aktstykker.data.value.length > 0 && (
        <div className="mb-6">
          <AktsTidslinje sager={aktstykker.data.value} />
        </div>
      )}

      {/* Loading */}
      {aktstykker.isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Fejl */}
      {aktstykker.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
          Kunne ikke hente aktstykker. Prøv igen senere.
        </div>
      )}

      {/* Grupperet visning */}
      {aktstykker.data && (
        <div className="space-y-4">
          {grouped.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Ingen aktstykker fundet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Prøv at ændre filtre eller søgning</p>
            </div>
          ) : (
            grouped.map(([ministerium, sager]) => (
              <MinisteriumSektion key={ministerium} ministerium={ministerium} sager={sager} pdfUrls={pdfUrls.data ?? {}} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
