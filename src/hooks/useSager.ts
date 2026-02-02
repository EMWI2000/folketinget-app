import { useQuery } from '@tanstack/react-query'
import { fetchSager, fetchSag } from '../api/ft'

export function useSager(opts: {
  search?: string
  typeid?: number
  page?: number
  pageSize?: number
}) {
  const skip = ((opts.page ?? 1) - 1) * (opts.pageSize ?? 20)
  return useQuery({
    queryKey: ['sager', opts.search, opts.typeid, opts.page, opts.pageSize],
    queryFn: () => fetchSager({
      top: opts.pageSize ?? 20,
      skip,
      search: opts.search || undefined,
      typeid: opts.typeid || undefined,
    }),
    placeholderData: (prev) => prev,
  })
}

export function useSag(id: number | null) {
  return useQuery({
    queryKey: ['sag', id],
    queryFn: () => fetchSag(id!),
    enabled: id !== null,
  })
}
