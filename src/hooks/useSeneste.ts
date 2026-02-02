import { useQuery } from '@tanstack/react-query'
import { fetchSenesteSager } from '../api/ft'

export function useSenesteSager() {
  return useQuery({
    queryKey: ['seneste-sager'],
    queryFn: () => fetchSenesteSager(15),
    refetchInterval: 5 * 60 * 1000, // Auto-refresh hvert 5. minut
  })
}
