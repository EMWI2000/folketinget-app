import { useQuery } from '@tanstack/react-query'
import { fetchAktstykker, fetchPerioder, fetchAktstykkePdfUrl } from '../api/ft'
import type { Sag } from '../types/ft'

export function usePerioder() {
  return useQuery({
    queryKey: ['perioder'],
    queryFn: fetchPerioder,
    staleTime: 10 * 60 * 1000, // 10 min cache
  })
}

export function useAktstykker(periodeid: number | null) {
  return useQuery({
    queryKey: ['aktstykker', periodeid],
    queryFn: () => fetchAktstykker(periodeid!),
    enabled: periodeid !== null,
  })
}

/** Batch-hent PDF-URLs for en liste af aktstykker */
export function useAktstykkePdfUrls(sager: Sag[] | undefined) {
  return useQuery({
    queryKey: ['aktstykke-pdf-urls', sager?.map(s => s.id)],
    queryFn: async () => {
      if (!sager) return {}
      const urls: Record<number, string | null> = {}
      // Hent maks 50 ad gangen for at undgå for mange parallelle kald
      const batch = sager.slice(0, 50)
      const results = await Promise.all(
        batch.map(async (sag) => {
          const url = await fetchAktstykkePdfUrl(sag.id, sag.SagDokument)
          return { id: sag.id, url }
        })
      )
      for (const r of results) {
        urls[r.id] = r.url
      }
      return urls
    },
    enabled: !!sager && sager.length > 0,
    staleTime: 30 * 60 * 1000, // 30 min cache
  })
}
