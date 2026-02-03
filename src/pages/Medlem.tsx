import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMedlemmer, useMedlemSager } from '../hooks/useMedlem'
import { SAG_TYPER, SAG_STATUS, SAGAKTØR_ROLLER } from '../types/ft'

function formatDato(dato: string | null): string {
  if (!dato) return ''
  return new Date(dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Medlem() {
  const [selectedParti, setSelectedParti] = useState<string | null>(null)
  const [selectedMedlem, setSelectedMedlem] = useState<number | null>(null)
  const [selectedRolle, setSelectedRolle] = useState<number | undefined>(undefined)
  const [visAlle, setVisAlle] = useState(false)

  const medlemmer = useMedlemmer()
  const sager = useMedlemSager(selectedMedlem, selectedRolle, visAlle ? 200 : 20)

  // Unikke partier fra data
  const partier = useMemo(() => {
    if (!medlemmer.data) return []
    const set = new Set<string>()
    for (const m of medlemmer.data) {
      if (m.parti) set.add(m.parti)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'da'))
  }, [medlemmer.data])

  // Filtrerede medlemmer baseret på parti
  const filteredMedlemmer = useMemo(() => {
    if (!medlemmer.data) return []
    if (!selectedParti) return medlemmer.data
    return medlemmer.data.filter((m) => m.parti === selectedParti)
  }, [medlemmer.data, selectedParti])

  // Info om valgt medlem
  const valgtMedlem = useMemo(() => {
    if (!selectedMedlem || !medlemmer.data) return null
    return medlemmer.data.find((m) => m.id === selectedMedlem) ?? null
  }, [selectedMedlem, medlemmer.data])

  // Sager fra SagAktør-response (med $expand=Sag)
  const sagListe = useMemo(() => {
    if (!sager.data?.value) return []
    return sager.data.value.filter((sa) => sa.Sag).map((sa) => ({
      ...sa.Sag!,
      sagaktørRolleid: sa.rolleid,
    }))
  }, [sager.data])

  const totalCount = sager.data ? parseInt(sager.data['odata.count'] ?? '0', 10) : 0

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Medlem</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Søg efter hvad et medlem af Folketinget har fremsat, spurgt om eller besvaret.
        Vælg et medlem og en handling for at se tilknyttede sager.
      </p>

      {/* Filtre */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Parti-filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parti
            </label>
            <select
              value={selectedParti ?? ''}
              onChange={(e) => {
                setSelectedParti(e.target.value || null)
                setSelectedMedlem(null)
                setVisAlle(false)
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="">Alle partier</option>
              {partier.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Medlem-dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Medlem
            </label>
            <select
              value={selectedMedlem ?? ''}
              onChange={(e) => {
                setSelectedMedlem(e.target.value ? Number(e.target.value) : null)
                setVisAlle(false)
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
              disabled={medlemmer.isLoading}
            >
              <option value="">
                {medlemmer.isLoading ? 'Henter medlemmer...' : 'Vælg medlem'}
              </option>
              {filteredMedlemmer.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.efternavn}, {m.fornavn}{m.partiKort ? ` (${m.partiKort})` : ''}
                </option>
              ))}
            </select>
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
        </div>
      </div>

      {/* Loading */}
      {medlemmer.isLoading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Henter medlemmer fra Folketinget...
        </div>
      )}

      {/* Error */}
      {medlemmer.error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6">
          Kunne ikke hente medlemmer: {(medlemmer.error as Error).message}
        </div>
      )}

      {/* Ingen medlem valgt */}
      {!selectedMedlem && !medlemmer.isLoading && !medlemmer.error && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Vælg et medlem ovenfor for at se deres sager
        </div>
      )}

      {/* Resultater */}
      {selectedMedlem && valgtMedlem && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {valgtMedlem.navn}
              {valgtMedlem.parti && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                  {valgtMedlem.parti}
                </span>
              )}
            </h3>
            {totalCount > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalCount} sag{totalCount !== 1 ? 'er' : ''}
                {selectedRolle ? ` som ${SAGAKTØR_ROLLER[selectedRolle]?.toLowerCase()}` : ''}
              </span>
            )}
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
              Ingen sager fundet{selectedRolle ? ` med denne handling` : ''}.
            </div>
          )}

          {sagListe.length > 0 && (
            <div className="space-y-3">
              {sagListe.map((sag) => (
                <Link
                  key={`${sag.id}-${sag.sagaktørRolleid}`}
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
                Vis alle {totalCount} sager
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
