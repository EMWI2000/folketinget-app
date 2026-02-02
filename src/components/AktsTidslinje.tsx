import type { Sag } from '../types/ft'

interface Props {
  sager: Sag[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']


export default function AktsTidslinje({ sager }: Props) {
  // Gruppér efter måned baseret på opdateringsdato
  const byMonth = new Map<string, Sag[]>()
  for (const s of sager) {
    const d = new Date(s.opdateringsdato)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(s)
  }

  const sorted = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  if (sorted.length === 0) return null

  const maxCount = Math.max(...sorted.map(([, s]) => s.length), 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Tidslinje
      </h3>

      <div className="flex items-end gap-1 h-32">
        {sorted.map(([key, items]) => {
          const month = parseInt(key.split('-')[1])
          const height = Math.max((items.length / maxCount) * 100, 8)

          // Farvekode: grøn = godkendt, amber = blanding
          const allGodkendt = items.every((s) => s.afgørelsesresultatkode === 'TU' || s.afgørelsesresultatkode === 'TF')
          const barColor = allGodkendt ? 'bg-green-400' : 'bg-ft-red/70'

          return (
            <div key={key} className="flex-1 flex flex-col items-center gap-1" title={`${MONTHS[month]} — ${items.length} aktstykker`}>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{items.length}</span>
              <div
                className={`w-full rounded-t-md ${barColor} transition-all duration-300`}
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{MONTHS[month]}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> Alle godkendt</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-ft-red/70" /> Blanding/under behandling</span>
      </div>
    </div>
  )
}
