import { useQuery } from '@tanstack/react-query'
import { fetchSoegMedlemmer, fetchMedlemParti, fetchMedlemSager } from '../api/ft'

export function useSoegMedlemmer(navn: string) {
  return useQuery({
    queryKey: ['soeg-medlemmer', navn],
    queryFn: () => fetchSoegMedlemmer(navn),
    enabled: navn.length >= 2,
    staleTime: 10 * 60 * 1000,
  })
}

export function useMedlemParti(aktørId: number | null) {
  return useQuery({
    queryKey: ['medlem-parti', aktørId],
    queryFn: () => fetchMedlemParti(aktørId!),
    enabled: aktørId !== null,
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
