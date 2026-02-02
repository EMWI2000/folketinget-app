import { useQuery } from '@tanstack/react-query'
import { fetchAktstykker, fetchPerioder } from '../api/ft'

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
