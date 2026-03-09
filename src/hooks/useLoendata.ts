import { useQuery } from '@tanstack/react-query'
import { parseLoenCSV } from '../lib/loendata/parser'
import type { LoenRaekke, TabelfordelingId } from '../lib/loendata/types'
import { TABELFORDELINGER } from '../lib/loendata/types'

async function fetchLoendata(tabelfordeling: TabelfordelingId): Promise<LoenRaekke[]> {
  const config = TABELFORDELINGER.find((t) => t.id === tabelfordeling)
  if (!config) throw new Error(`Ukendt tabelfordeling: ${tabelfordeling}`)

  const response = await fetch(`/loendata/${config.file}`)
  if (!response.ok) {
    throw new Error('Kunne ikke hente løndata')
  }
  const text = await response.text()
  return parseLoenCSV(text)
}

export function useLoendata(tabelfordeling: TabelfordelingId) {
  return useQuery({
    queryKey: ['loendata', tabelfordeling],
    queryFn: () => fetchLoendata(tabelfordeling),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  })
}
