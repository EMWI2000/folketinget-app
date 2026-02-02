import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSager } from '../hooks/useSager'
import { usePerioder } from '../hooks/useAktstykker'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import SagKort from '../components/SagKort'
import Pagination from '../components/Pagination'
import PeriodeSelect, { useDefaultPeriode } from '../components/PeriodeSelect'

const PAGE_SIZE = 20

export default function Soeg() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [search, setSearch] = useState(initialQuery)
  const [typeid, setTypeid] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const perioder = usePerioder()
  const defaultPeriode = useDefaultPeriode(perioder.data)
  const [selectedPeriode, setSelectedPeriode] = useState<number | null>(null)
  const aktivPeriode = selectedPeriode ?? defaultPeriode

  // Opdater søgning hvis query-param ændres (f.eks. fra emneord-klik)
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== search) {
      setSearch(q)
      setPage(1)
    }
  }, [searchParams])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleTypeChange = useCallback((type: number | null) => {
    setTypeid(type)
    setPage(1)
  }, [])

  const handlePeriodeChange = useCallback((periodeid: number | null) => {
    setSelectedPeriode(periodeid)
    setPage(1)
  }, [])

  const { data, isLoading, error } = useSager({
    search,
    typeid: typeid ?? undefined,
    periodeid: aktivPeriode ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const totalCount = data?.['odata.count'] ? parseInt(data['odata.count'], 10) : undefined

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Søg i sager</h2>
        <p className="text-gray-500 text-sm">Søg og filtrer i alle folketingssager</p>
      </div>

      <div className="space-y-4 mb-6">
        <SearchBar value={search} onChange={handleSearchChange} />
        <div className="flex flex-wrap gap-3 items-center">
          <FilterPanel selectedType={typeid} onTypeChange={handleTypeChange} />
          <PeriodeSelect
            perioder={perioder.data}
            value={aktivPeriode}
            onChange={handlePeriodeChange}
            showAll
          />
        </div>
      </div>

      {totalCount !== undefined && (
        <p className="text-sm text-gray-500 mb-4">
          {totalCount.toLocaleString('da-DK')} resultater
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Kunne ikke hente sager. Prøv igen senere.
        </div>
      )}

      {data && (
        <>
          {data.value.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Ingen sager fundet</p>
              <p className="text-sm text-gray-400 mt-1">Prøv at ændre din søgning eller filtre</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.value.map((sag) => (
                <SagKort key={sag.id} sag={sag} />
              ))}
            </div>
          )}
          {totalCount !== undefined && totalCount > PAGE_SIZE && (
            <Pagination
              page={page}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
