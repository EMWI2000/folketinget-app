import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePerioder, useAktstykker } from '../hooks/useAktstykker'
import type { Sag, Periode } from '../types/ft'
import StatKort from '../components/StatKort'

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

function MinisteriumSektion({ ministerium, sager }: { ministerium: string; sager: Sag[] }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ft-red/10 rounded-lg flex items-center justify-center text-ft-red text-sm font-bold">
            §
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{ministerium}</h3>
            <p className="text-xs text-gray-500">{sager.length} aktstykke{sager.length !== 1 ? 'r' : ''}</p>
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
        <div className="border-t border-gray-100">
          {sager.map((sag) => (
            <Link
              key={sag.id}
              to={`/sag/${sag.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-ft-red">{sag.nummer}</span>
                  {getAfgørelsesBadge(sag.afgørelsesresultatkode)}
                </div>
                <p className="text-sm text-gray-700 group-hover:text-ft-red transition-colors truncate">
                  {sag.titelkort || sag.titel}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-3">
                {formatDato(sag.opdateringsdato)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Aktstykker() {
  const perioder = usePerioder()

  // Find samlinger (ikke finansår) og default til nyeste
  const samlinger = useMemo(() => {
    if (!perioder.data) return []
    return perioder.data.filter((p: Periode) =>
      p.titel.includes('-') // Samlinger har format "2025-26"
    )
  }, [perioder.data])

  const [selectedPeriode, setSelectedPeriode] = useState<number | null>(null)
  const aktivPeriode = selectedPeriode ?? samlinger[0]?.id ?? null

  const aktstykker = useAktstykker(aktivPeriode)

  // Filtre
  const [search, setSearch] = useState('')
  const [selectedMinisterium, setSelectedMinisterium] = useState<string | null>(null)

  // Gruppér og filtrer
  const { grouped, ministerier, stats } = useMemo(() => {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Aktstykker</h2>
        <p className="text-gray-500 text-sm">Finansudvalgets bevillinger grupperet efter ministerium</p>
      </div>

      {/* Filter-bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={aktivPeriode ?? ''}
          onChange={(e) => setSelectedPeriode(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ft-red/30"
        >
          {samlinger.map((p) => (
            <option key={p.id} value={p.id}>{p.titel}</option>
          ))}
        </select>
        <select
          value={selectedMinisterium ?? ''}
          onChange={(e) => setSelectedMinisterium(e.target.value || null)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ft-red/30"
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
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ft-red/30"
          />
        </div>
      </div>

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

      {/* Loading */}
      {aktstykker.isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Fejl */}
      {aktstykker.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Kunne ikke hente aktstykker. Prøv igen senere.
        </div>
      )}

      {/* Grupperet visning */}
      {aktstykker.data && (
        <div className="space-y-4">
          {grouped.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Ingen aktstykker fundet</p>
              <p className="text-sm text-gray-400 mt-1">Prøv at ændre filtre eller søgning</p>
            </div>
          ) : (
            grouped.map(([ministerium, sager]) => (
              <MinisteriumSektion key={ministerium} ministerium={ministerium} sager={sager} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
