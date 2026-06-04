import { useQuery } from '@tanstack/react-query'
import type { LoenRaekke, TabelfordelingId } from '../lib/loendata/types'
import { TABELFORDELINGER } from '../lib/loendata/types'
import { parseLoendataInWorker } from '../lib/parseClient'

function fetchLoendata(tabelfordeling: TabelfordelingId): Promise<LoenRaekke[]> {
  const config = TABELFORDELINGER.find((t) => t.id === tabelfordeling)
  if (!config) throw new Error(`Ukendt tabelfordeling: ${tabelfordeling}`)

  // Hentning + parsing sker i en Web Worker, så main thread ikke blokeres
  return parseLoendataInWorker(`/loendata/${config.file}`)
}

export function useLoendata(tabelfordeling: TabelfordelingId) {
  return useQuery({
    queryKey: ['loendata', tabelfordeling],
    queryFn: () => fetchLoendata(tabelfordeling),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  })
}
