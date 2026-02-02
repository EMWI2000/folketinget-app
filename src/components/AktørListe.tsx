import type { AktørMedRolle } from '../types/ft'
import { AKTØR_ROLLER } from '../types/ft'

export default function AktørListe({ aktører }: { aktører: AktørMedRolle[] }) {
  if (aktører.length === 0) return null

  // Gruppér efter rolle
  const grouped = aktører.reduce<Record<string, AktørMedRolle[]>>((acc, a) => {
    const rolle = AKTØR_ROLLER[a.rolleid] || `Rolle ${a.rolleid}`
    if (!acc[rolle]) acc[rolle] = []
    acc[rolle].push(a)
    return acc
  }, {})

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Aktører ({aktører.length})
      </h2>
      <div className="space-y-4">
        {Object.entries(grouped).map(([rolle, personer]) => (
          <div key={rolle}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {rolle}
            </h3>
            <div className="flex flex-wrap gap-2">
              {personer.map((person) => (
                <div
                  key={person.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="w-6 h-6 bg-ft-red/10 text-ft-red rounded-full flex items-center justify-center text-xs font-bold">
                    {(person.fornavn?.[0] || person.navn[0]).toUpperCase()}
                  </div>
                  <span className="text-gray-800 font-medium">{person.navn}</span>
                  {person.gruppenavnkort && (
                    <span className="text-xs text-gray-400">({person.gruppenavnkort})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
