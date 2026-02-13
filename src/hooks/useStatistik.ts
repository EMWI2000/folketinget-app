import { useQuery } from '@tanstack/react-query'
import { fetchSagerCount, fetchAfstemningerCount, fetchAktstykker, fetchSager } from '../api/ft'
import { SAG_TYPER, SAG_STATUS } from '../types/ft'

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

/** Alm. del opdelt efter nummerprefix (S=Spørgsmål, US=Hasteforespørgsel, etc.) */
const ALM_DEL_PREFIXES: Record<string, string> = {
  'S': 'Alm. del spørgsmål',
  'US': 'Ubesvarede spørgsmål',
  'SAU': 'Samrådsspørgsmål',
  'B': 'Beretning',
  'BEU': 'Betænkning',
}

export function useAlmDelOpdelt(periodeid?: number) {
  return useQuery({
    queryKey: ['statistik', 'alm-del-opdelt', periodeid],
    queryFn: async () => {
      // Hent op til 1000 Alm. del sager (typeid 10) for perioden
      const res = await fetchSager({ top: 1000, typeid: 10, periodeid })

      // Grupper efter nummerprefix
      const counts = new Map<string, number>()
      for (const sag of res.value) {
        const prefix = sag.nummerprefix || 'Andet'
        counts.set(prefix, (counts.get(prefix) || 0) + 1)
      }

      return [...counts.entries()]
        .map(([prefix, count]) => ({
          prefix,
          label: ALM_DEL_PREFIXES[prefix] || `Alm. del (${prefix})`,
          count
        }))
        .sort((a, b) => b.count - a.count)
    },
  })
}

/** Sager fordelt efter status for en given periode */
export function useSagerPerStatus(periodeid?: number) {
  const statusIds = Object.keys(SAG_STATUS).map(Number)

  return useQuery({
    queryKey: ['statistik', 'sager-per-status', periodeid],
    queryFn: async () => {
      const counts = await Promise.all(
        statusIds.map(async (statusid) => {
          const filter = periodeid
            ? `statusid eq ${statusid} and periodeid eq ${periodeid}`
            : `statusid eq ${statusid}`
          const count = await fetchSagerCount(filter)
          return { statusid, label: SAG_STATUS[statusid], count }
        })
      )
      return counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count)
    },
  })
}

/** Lovforslag opdelt efter status (vedtaget, forkastet, under behandling, etc.) */
export function useLovforslagPerStatus(periodeid?: number) {
  const statusIds = Object.keys(SAG_STATUS).map(Number)

  return useQuery({
    queryKey: ['statistik', 'lovforslag-per-status', periodeid],
    queryFn: async () => {
      const counts = await Promise.all(
        statusIds.map(async (statusid) => {
          const filter = periodeid
            ? `typeid eq 3 and statusid eq ${statusid} and periodeid eq ${periodeid}`
            : `typeid eq 3 and statusid eq ${statusid}`
          const count = await fetchSagerCount(filter)
          return { statusid, label: SAG_STATUS[statusid], count }
        })
      )
      return counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count)
    },
  })
}
