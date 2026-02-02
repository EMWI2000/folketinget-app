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
      className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ft-red/30"
    >
      {showAll && <option value="">Alle samlinger</option>}
      {samlinger.map((p) => (
        <option key={p.id} value={p.id}>{periodeLabel(p)}</option>
      ))}
    </select>
  )
}

export function useDefaultPeriode(perioder: Periode[] | undefined): number | null {
  return useMemo(() => {
    if (!perioder) return null
    const samlinger = perioder.filter((p) => p.type === 'samling')
    return samlinger[0]?.id ?? null
  }, [perioder])
}
