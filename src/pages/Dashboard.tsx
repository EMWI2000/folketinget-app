import { Link } from 'react-router-dom'
import { useSenesteSager } from '../hooks/useSeneste'
import { useAfstemninger } from '../hooks/useAfstemninger'
import SagKort from '../components/SagKort'
import AfstemningKort from '../components/AfstemningKort'

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
  const sager = useSenesteSager()
  const afstemninger = useAfstemninger({ pageSize: 5 })

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2>
        <p className="text-gray-500 text-sm">Seneste aktivitet i Folketinget</p>
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
