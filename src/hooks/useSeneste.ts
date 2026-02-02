import { useQuery } from '@tanstack/react-query'
import { fetchSenesteSager } from '../api/ft'

export function useSenesteSager(periodeid?: number) {
  return useQuery({
    queryKey: ['seneste-sager', periodeid],
    queryFn: () => fetchSenesteSager(15, periodeid),
    refetchInterval: 5 * 60 * 1000, // Auto-refresh hvert 5. minut
  })
}
