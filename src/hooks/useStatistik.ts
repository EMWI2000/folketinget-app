import { useQuery } from '@tanstack/react-query'
import { fetchSagerCount, fetchAfstemningerCount, fetchAlleEmneordSager, fetchEmneordBatch } from '../api/ft'
import { SAG_TYPER } from '../types/ft'

export function useSagerTotal() {
  return useQuery({
    queryKey: ['statistik', 'sager-total'],
    queryFn: () => fetchSagerCount(),
  })
}

export function useAfstemningerTotal() {
  return useQuery({
    queryKey: ['statistik', 'afstemninger-total'],
    queryFn: () => fetchAfstemningerCount(),
  })
}

export function useSagerPerType() {
  const typeIds = Object.keys(SAG_TYPER).map(Number)

  return useQuery({
    queryKey: ['statistik', 'sager-per-type'],
    queryFn: async () => {
      const counts = await Promise.all(
        typeIds.map(async (typeid) => {
          const count = await fetchSagerCount(`typeid eq ${typeid}`)
          return { typeid, label: SAG_TYPER[typeid], count }
        })
      )
      return counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count)
    },
  })
}

export function useTopEmneord() {
  return useQuery({
    queryKey: ['statistik', 'top-emneord'],
    queryFn: async () => {
      const res = await fetchAlleEmneordSager(500)
      // Tæl forekomster af hvert emneord
      const counts = new Map<number, number>()
      for (const es of res.value) {
        counts.set(es.emneordid, (counts.get(es.emneordid) || 0) + 1)
      }
      // Sortér og tag top 30
      const top = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)

      // Hent emneord-tekster
      const emneordIds = top.map(([id]) => id)
      const emneordData = await fetchEmneordBatch(emneordIds)

      return top.map(([id, count]) => {
        const e = emneordData.find((em) => em.id === id)
        return { id, emneord: e?.emneord ?? `#${id}`, count }
      }).filter((e) => e.emneord.length > 2) // Filtrer tomme/korte
    },
  })
}
