import { useQuery } from '@tanstack/react-query'
import { fetchMedlemmerMedParti, fetchMedlemSager } from '../api/ft'

export function useMedlemmer() {
  return useQuery({
    queryKey: ['medlemmer-med-parti'],
    queryFn: fetchMedlemmerMedParti,
    staleTime: 10 * 60 * 1000,
  })
}

export function useMedlemSager(aktørId: number | null, rolleid?: number, top: number = 20, skip: number = 0) {
  return useQuery({
    queryKey: ['medlem-sager', aktørId, rolleid, top, skip],
    queryFn: () => fetchMedlemSager({ aktørId: aktørId!, rolleid, top, skip }),
    enabled: aktørId !== null,
  })
}
