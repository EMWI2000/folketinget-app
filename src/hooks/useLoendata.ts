import { useQuery } from '@tanstack/react-query'
import { parseLoenCSV } from '../lib/loendata/parser'
import type { LoenRaekke } from '../lib/loendata/types'

async function fetchLoendata(): Promise<LoenRaekke[]> {
  const response = await fetch('/loendata/loenoverblik_hovedkonto.csv')
  if (!response.ok) {
    throw new Error('Kunne ikke hente løndata')
  }
  const text = await response.text()
  return parseLoenCSV(text)
}

export function useLoendata() {
  return useQuery({
    queryKey: ['loendata'],
    queryFn: fetchLoendata,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  })
}
