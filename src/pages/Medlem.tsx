import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSoegMedlemmer, useMedlemParti, useMedlemSager } from '../hooks/useMedlem'
import { usePerioder } from '../hooks/useAktstykker'
import { SAG_TYPER, SAG_STATUS, SAGAKTØR_ROLLER, periodeLabel } from '../types/ft'
import type { Aktør } from '../types/ft'

function formatDato(dato: string | null): string {
  if (!dato) return ''
  return new Date(dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Medlem() {
  const [navnSoeg, setNavnSoeg] = useState('')
  const [selectedMedlem, setSelectedMedlem] = useState<Aktør | null>(null)
  const [selectedRolle, setSelectedRolle] = useState<number | undefined>(undefined)
  const [selectedPeriode, setSelectedPeriode] = useState<number | null>(null)
  const [visAlle, setVisAlle] = useState(false)

  const soegResultater = useSoegMedlemmer(navnSoeg)
  const parti = useMedlemParti(selectedMedlem?.id ?? null)
  const perioder = usePerioder()
  const sager = useMedlemSager(selectedMedlem?.id ?? null, selectedRolle, visAlle ? 200 : 20)

  // Filtrér sager på periode i klienten (kan ikke gøres i SagAktør API)
  const sagListe = useMemo(() => {
    if (!sager.data?.value) return []
    return sager.data.value
      .filter((sa) => sa.Sag)
      .map((sa) => ({
        ...sa.Sag!,
        sagaktørRolleid: sa.rolleid,
      }))
      .filter((sag) => !selectedPeriode || sag.periodeid === selectedPeriode)
  }, [sager.data, selectedPeriode])

  const totalCount = sager.data ? parseInt(sager.data['odata.count'] ?? '0', 10) : 0

  const handleSelectMedlem = useCallback((medlem: Aktør) => {
    setSelectedMedlem(medlem)
    setNavnSoeg('')
    setVisAlle(false)
  }, [])

  // Samlings-dropdown (kun "samling" typer)
  const samlinger = useMemo(() => {
    if (!perioder.data) return []
    return perioder.data.filter((p) => p.type === 'samling')
  }, [perioder.data])

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Medlem</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Søg efter hvad et medlem af Folketinget har fremsat, spurgt om eller besvaret.
        Skriv et navn for at finde et medlem.
      </p>

      {/* Søg + filtre */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Navnesøgning */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Søg medlem
            </label>
            <input
              type="text"
              value={selectedMedlem ? selectedMedlem.navn : navnSoeg}
              onChange={(e) => {
                setNavnSoeg(e.target.value)
                if (selectedMedlem) {
                  setSelectedMedlem(null)
                  setVisAlle(false)
                }
              }}
              onFocus={() => {
                if (selectedMedlem) {
                  setNavnSoeg(selectedMedlem.navn)
                  setSelectedMedlem(null)
                }
              }}
              placeholder="Skriv et navn..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            />
            {/* Dropdown med søgeresultater */}
            {navnSoeg.length >= 2 && !selectedMedlem && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {soegResultater.isLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Søger...</div>
                )}
                {soegResultater.data && soegResultater.data.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Ingen resultater</div>
                )}
                {soegResultater.data?.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMedlem(m)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  >
                    {m.navn}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rolle/handling-dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Handling
            </label>
            <select
              value={selectedRolle ?? ''}
              onChange={(e) => {
                setSelectedRolle(e.target.value ? Number(e.target.value) : undefined)
                setVisAlle(false)
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="">Alle handlinger</option>
              {Object.entries(SAGAKTØR_ROLLER).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          {/* Periode-dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Samling
            </label>
            <select
              value={selectedPeriode ?? ''}
              onChange={(e) => setSelectedPeriode(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="">Alle samlinger</option>
              {samlinger.map((p) => (
                <option key={p.id} value={p.id}>{periodeLabel(p)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ingen medlem valgt */}
      {!selectedMedlem && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Søg efter et medlem ovenfor for at se deres sager
        </div>
      )}

      {/* Resultater */}
      {selectedMedlem && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedMedlem.navn}
              {parti.data && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2 text-base">
                  {parti.data}
                </span>
              )}
              {parti.isLoading && (
                <span className="text-gray-400 dark:text-gray-500 font-normal ml-2 text-sm">
                  (henter parti...)
                </span>
              )}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {sagListe.length} sag{sagListe.length !== 1 ? 'er' : ''}
              {selectedRolle ? ` som ${SAGAKTØR_ROLLER[selectedRolle]?.toLowerCase()}` : ''}
              {selectedPeriode ? ' i valgt samling' : ''}
              {totalCount > sagListe.length && !selectedPeriode ? ` (af ${totalCount} totalt)` : ''}
            </span>
          </div>

          {/* Sager loading */}
          {sager.isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Sager error */}
          {sager.error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl">
              Kunne ikke hente sager: {(sager.error as Error).message}
            </div>
          )}

          {/* Sager liste */}
          {!sager.isLoading && sagListe.length === 0 && !sager.error && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Ingen sager fundet{selectedRolle ? ' med denne handling' : ''}{selectedPeriode ? ' i denne samling' : ''}.
            </div>
          )}

          {sagListe.length > 0 && (
            <div className="space-y-3">
              {sagListe.map((sag, idx) => (
                <Link
                  key={`${sag.id}-${sag.sagaktørRolleid}-${idx}`}
                  to={`/sag/${sag.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-bold text-ft-red">
                          {sag.nummerprefix}{sag.nummernumerisk}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {SAG_TYPER[sag.typeid] ?? `Type ${sag.typeid}`}
                        </span>
                        {sag.sagaktørRolleid && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {SAGAKTØR_ROLLER[sag.sagaktørRolleid] ?? `Rolle ${sag.sagaktørRolleid}`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium leading-snug">
                        {sag.titelkort || sag.titel}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        sag.statusid === 20 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        sag.statusid === 28 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {SAG_STATUS[sag.statusid] ?? `Status ${sag.statusid}`}
                      </span>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDato(sag.opdateringsdato)}
                      </p>
                    </div>
                  </div>
                  {sag.resume && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {sag.resume}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Vis flere / vis alle */}
          {!visAlle && totalCount > 20 && sagListe.length > 0 && (
            <div className="text-center mt-6">
              <button
                onClick={() => setVisAlle(true)}
                className="px-6 py-2 bg-ft-red text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Vis flere (henter op til 200)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
