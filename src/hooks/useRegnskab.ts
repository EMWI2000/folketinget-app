import { useQuery } from '@tanstack/react-query'
import { parseRegnskabCSV, parseAllRegnskab, fetchAvailableRegnskabYears } from '../lib/regnskab/parser'
import type { RegnskabData } from '../lib/regnskab/types'

/** Hook til at hente tilgængelige regnskabsår */
export function useAvailableRegnskabYears() {
  return useQuery({
    queryKey: ['regnskab', 'years'],
    queryFn: fetchAvailableRegnskabYears,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  })
}

/** Hook til at hente regnskabsdata for et enkelt år */
export function useRegnskab(year: number) {
  return useQuery({
    queryKey: ['regnskab', year],
    queryFn: () => parseRegnskabCSV(year),
    staleTime: Infinity, // Data ændrer sig aldrig
    gcTime: 30 * 60 * 1000, // Hold i cache i 30 min
  })
}

/** Hook til at hente regnskabsdata for alle tilgængelige år */
export function useAllRegnskab() {
  return useQuery({
    queryKey: ['regnskab', 'all'],
    queryFn: parseAllRegnskab,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  })
}

/** Hook til at søge i regnskabsdata */
export function useRegnskabSearch(data: RegnskabData | undefined, searchTerm: string) {
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
      // For regnskabskonti, brug node.id i stedet for node.code
      matchedCodes.add(node.id)

      // Tilføj alle ancestors
      let parentCode = node.parentCode
      while (parentCode) {
        const parent = data.index[parentCode]
        if (parent) {
          matchedCodes.add(parent.id)
          parentCode = parent.parentCode
        } else {
          parentCode = null
        }
      }
    }
  }

  // Filtrer træet til kun at vise matched noder
  function filterTree(nodes: RegnskabData['tree']): RegnskabData['tree'] {
    return nodes
      .filter(n => matchedCodes.has(n.id))
      .map(n => ({
        ...n,
        children: filterTree(n.children),
      }))
  }

  return filterTree(data.tree)
}
