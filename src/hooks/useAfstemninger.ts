import { useQuery } from '@tanstack/react-query'
import { fetchAfstemninger } from '../api/ft'

export function useAfstemninger(opts: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['afstemninger', opts.page, opts.pageSize],
    queryFn: () => fetchAfstemninger({
      top: opts.pageSize ?? 10,
      skip: ((opts.page ?? 1) - 1) * (opts.pageSize ?? 10),
    }),
    refetchInterval: 5 * 60 * 1000,
  })
}
