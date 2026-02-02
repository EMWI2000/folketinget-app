import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSenesteSager } from '../hooks/useSeneste'
import { useAfstemninger } from '../hooks/useAfstemninger'
import { useSagerTotal, useAfstemningerTotal } from '../hooks/useStatistik'
import { usePerioder } from '../hooks/useAktstykker'
import SagKort from '../components/SagKort'
import AfstemningKort from '../components/AfstemningKort'
import StatKort from '../components/StatKort'
import PeriodeSelect, { useDefaultPeriode } from '../components/PeriodeSelect'

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      {message}
    </div>
  )
}

export default function Dashboard() {
  const perioder = usePerioder()
  const defaultPeriode = useDefaultPeriode(perioder.data)
  const [selectedPeriode, setSelectedPeriode] = useState<number | null>(null)
  const aktivPeriode = selectedPeriode ?? defaultPeriode

  const handlePeriodeChange = useCallback((periodeid: number | null) => {
    setSelectedPeriode(periodeid)
  }, [])

  const sager = useSenesteSager(aktivPeriode ?? undefined)
  const afstemninger = useAfstemninger({ pageSize: 5 })
  const sagerTotal = useSagerTotal()
  const afstemningerTotal = useAfstemningerTotal()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2>
          <p className="text-gray-500 text-sm">Seneste aktivitet i Folketinget</p>
        </div>
        <PeriodeSelect
          perioder={perioder.data}
          value={aktivPeriode}
          onChange={handlePeriodeChange}
          showAll
        />
      </div>

      {/* Stat-kort */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatKort
          label="Sager i alt"
          value={sagerTotal.data}
          loading={sagerTotal.isLoading}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatKort
          label="Afstemninger"
          value={afstemningerTotal.data}
          loading={afstemningerTotal.isLoading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatKort
          label="Senest opdateret"
          value={sager.data?.value[0]
            ? new Date(sager.data.value[0].opdateringsdato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            : undefined
          }
          loading={sager.isLoading}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seneste sager */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Seneste sager</h3>
            <Link
              to="/soeg"
              className="text-sm text-ft-red hover:text-ft-red-dark font-medium transition-colors"
            >
              Se alle &rarr;
            </Link>
          </div>
          {sager.isLoading && <LoadingSkeleton />}
          {sager.error && <ErrorBox message="Kunne ikke hente sager. Prøv igen senere." />}
          {sager.data && (
            <div className="space-y-3">
              {sager.data.value.map((sag) => (
                <SagKort key={sag.id} sag={sag} />
              ))}
            </div>
          )}
        </div>

        {/* Seneste afstemninger */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seneste afstemninger</h3>
          {afstemninger.isLoading && <LoadingSkeleton />}
          {afstemninger.error && <ErrorBox message="Kunne ikke hente afstemninger." />}
          {afstemninger.data && (
            <div className="space-y-3">
              {afstemninger.data.value.map((a) => (
                <AfstemningKort key={a.id} afstemning={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
