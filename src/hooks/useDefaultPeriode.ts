import { useMemo } from 'react'
import type { Periode } from '../types/ft'

/**
 * Returnerer id'et på den nyeste samling (default-valg) ud fra en liste af perioder.
 * Ligger i en separat fil (ikke i PeriodeSelect-komponenten), så fast refresh virker.
 */
export function useDefaultPeriode(perioder: Periode[] | undefined): number | null {
  return useMemo(() => {
    if (!perioder) return null
    const samlinger = perioder.filter((p) => p.type === 'samling')
    return samlinger[0]?.id ?? null
  }, [perioder])
}
