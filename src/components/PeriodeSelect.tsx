import { useMemo } from 'react'
import type { Periode } from '../types/ft'
import { periodeLabel } from '../types/ft'

interface PeriodeSelectProps {
  perioder: Periode[] | undefined
  value: number | null
  onChange: (periodeid: number | null) => void
  showAll?: boolean
}

export default function PeriodeSelect({ perioder, value, onChange, showAll }: PeriodeSelectProps) {
  const samlinger = useMemo(() => {
    if (!perioder) return []
    return perioder.filter((p) => p.type === 'samling')
  }, [perioder])

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      aria-label="Vælg samling"
      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ft-red/30"
    >
      {showAll && <option value="">Alle samlinger</option>}
      {samlinger.map((p) => (
        <option key={p.id} value={p.id}>{periodeLabel(p)}</option>
      ))}
    </select>
  )
}
