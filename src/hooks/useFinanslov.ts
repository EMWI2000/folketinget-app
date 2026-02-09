import { useQuery } from '@tanstack/react-query'
import { parseFinanslovCSV, parseAllFinanslov } from '../lib/finanslov/parser'
import type { FinanslovData } from '../lib/finanslov/types'

/** Hook til at hente finanslovsdata for et enkelt år */
export function useFinanslov(year: 2024 | 2025 | 2026) {
  return useQuery({
    queryKey: ['finanslov', year],
    queryFn: () => parseFinanslovCSV(year),
    staleTime: Infinity, // Data ændrer sig aldrig
    gcTime: 30 * 60 * 1000, // Hold i cache i 30 min
  })
}

/** Hook til at hente finanslovsdata for alle tre år */
export function useAllFinanslov() {
  return useQuery({
    queryKey: ['finanslov', 'all'],
    queryFn: parseAllFinanslov,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  })
}

/** Hook til at søge i finanslovsdata */
export function useFinanslovSearch(data: FinanslovData | undefined, searchTerm: string) {
  if (!data || searchTerm.length < 2) {
    return data?.tree ?? []
  }

  const term = searchTerm.toLowerCase()

  // Søg i alle noder og returner matches + deres ancestors
  const matchedCodes = new Set<string>()

  for (const node of data.nodes) {
    if (
      node.code.toLowerCase().includes(term) ||
      node.name.toLowerCase().includes(term)
    ) {
      matchedCodes.add(node.code)

      // Tilføj alle ancestors
      let parentCode = node.parentCode
      while (parentCode) {
        matchedCodes.add(parentCode)
        const parent = data.index[parentCode]
        parentCode = parent?.parentCode ?? null
      }
    }
  }

  // Filtrer træet til kun at vise matched noder
  function filterTree(nodes: FinanslovData['tree']): FinanslovData['tree'] {
    return nodes
      .filter(n => matchedCodes.has(n.code))
      .map(n => ({
        ...n,
        children: filterTree(n.children),
      }))
  }

  return filterTree(data.tree)
}
