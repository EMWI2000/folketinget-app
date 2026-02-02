import { useQuery } from '@tanstack/react-query'
import { fetchSagerCount, fetchAfstemningerCount, fetchAktstykker } from '../api/ft'
import { SAG_TYPER } from '../types/ft'

export function useSagerTotal(periodeid?: number) {
  return useQuery({
    queryKey: ['statistik', 'sager-total', periodeid],
    queryFn: () => fetchSagerCount(periodeid ? `periodeid eq ${periodeid}` : undefined),
  })
}

export function useAfstemningerTotal() {
  return useQuery({
    queryKey: ['statistik', 'afstemninger-total'],
    queryFn: () => fetchAfstemningerCount(),
  })
}

export function useSagerPerType(periodeid?: number) {
  const typeIds = Object.keys(SAG_TYPER).map(Number)

  return useQuery({
    queryKey: ['statistik', 'sager-per-type', periodeid],
    queryFn: async () => {
      const counts = await Promise.all(
        typeIds.map(async (typeid) => {
          const filter = periodeid
            ? `typeid eq ${typeid} and periodeid eq ${periodeid}`
            : `typeid eq ${typeid}`
          const count = await fetchSagerCount(filter)
          return { typeid, label: SAG_TYPER[typeid], count }
        })
      )
      return counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count)
    },
  })
}

export function useAktstykkerPerMinisterium(periodeid: number | null) {
  return useQuery({
    queryKey: ['statistik', 'aktstykker-per-ministerium', periodeid],
    queryFn: async () => {
      const res = await fetchAktstykker(periodeid!)
      const counts = new Map<string, number>()
      for (const sag of res.value) {
        const ministerium = sag.paragraf || 'Ukendt'
        counts.set(ministerium, (counts.get(ministerium) || 0) + 1)
      }
      return [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
    },
    enabled: periodeid !== null,
  })
}
