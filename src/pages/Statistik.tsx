import { useNavigate } from 'react-router-dom'
import { useSagerTotal, useAfstemningerTotal, useSagerPerType, useTopEmneord } from '../hooks/useStatistik'
import StatKort from '../components/StatKort'
import BarChart from '../components/BarChart'

const COLORS = [
  '#a1172f', '#2563eb', '#059669', '#d97706', '#7c3aed',
  '#dc2626', '#0891b2', '#4f46e5', '#ca8a04', '#be185d',
  '#16a34a',
]

export default function Statistik() {
  const navigate = useNavigate()
  const sagerTotal = useSagerTotal()
  const afstemningerTotal = useAfstemningerTotal()
  const sagerPerType = useSagerPerType()
  const topEmneord = useTopEmneord()

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Statistik</h2>
        <p className="text-gray-500 text-sm">Overblik over data i Folketingets åbne data</p>
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
          label="Afstemninger i alt"
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
          label="Sagstyper"
          value={sagerPerType.data?.length}
          loading={sagerPerType.isLoading}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        />
      </div>

      {/* Bar chart: Sager per type */}
      {sagerPerType.data && (
        <div className="mb-8">
          <BarChart
            title="Sager fordelt efter type"
            data={sagerPerType.data.map((d, i) => ({
              label: d.label,
              value: d.count,
              color: COLORS[i % COLORS.length],
            }))}
          />
        </div>
      )}
      {sagerPerType.isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      )}

      {/* Top emneord */}
      {topEmneord.data && topEmneord.data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top emneord (seneste sager)</h3>
          <div className="flex flex-wrap gap-2">
            {topEmneord.data.map((e) => {
              const maxCount = topEmneord.data![0].count
              const minSize = 0.75
              const maxSize = 1.5
              const size = minSize + ((e.count / maxCount) * (maxSize - minSize))
              const opacity = 0.5 + (e.count / maxCount) * 0.5
              return (
                <button
                  key={e.id}
                  onClick={() => navigate(`/soeg?q=${encodeURIComponent(e.emneord)}`)}
                  className="px-3 py-1 rounded-full bg-ft-red/10 text-ft-red hover:bg-ft-red/20 transition-colors cursor-pointer font-medium"
                  style={{ fontSize: `${size}rem`, opacity }}
                  title={`${e.count} sager`}
                >
                  {e.emneord}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {topEmneord.isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="flex flex-wrap gap-2">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-full" style={{ width: `${60 + Math.random() * 80}px` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
