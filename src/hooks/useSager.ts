import { useQuery } from '@tanstack/react-query'
import { fetchSager, fetchSag, fetchDokumenter, fetchAktører, fetchEmneordBatch } from '../api/ft'
import type { AktørMedRolle } from '../types/ft'

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

export function useSagDokumenter(dokumentIds: number[]) {
  return useQuery({
    queryKey: ['sag-dokumenter', dokumentIds],
    queryFn: () => fetchDokumenter(dokumentIds),
    enabled: dokumentIds.length > 0,
  })
}

export function useSagAktører(aktørRelationer: { aktørid: number; rolleid: number }[]) {
  const aktørIds = aktørRelationer.map((r) => r.aktørid)
  return useQuery({
    queryKey: ['sag-aktører', aktørIds],
    queryFn: async (): Promise<AktørMedRolle[]> => {
      const aktører = await fetchAktører(aktørIds)
      return aktører.map((a) => {
        const relation = aktørRelationer.find((r) => r.aktørid === a.id)
        return { ...a, rolleid: relation?.rolleid ?? 0 }
      })
    },
    enabled: aktørIds.length > 0,
  })
}

export function useSagEmneord(emneordIds: number[]) {
  return useQuery({
    queryKey: ['sag-emneord', emneordIds],
    queryFn: () => fetchEmneordBatch(emneordIds),
    enabled: emneordIds.length > 0,
  })
}
