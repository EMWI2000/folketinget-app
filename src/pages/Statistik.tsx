import { useState } from 'react'
import { useSagerTotal, useAfstemningerTotal, useSagerPerType, useAktstykkerPerMinisterium } from '../hooks/useStatistik'
import { usePerioder } from '../hooks/useAktstykker'
import { periodeLabel } from '../types/ft'
import StatKort from '../components/StatKort'
import BarChart from '../components/BarChart'
import PeriodeSelect, { useDefaultPeriode } from '../components/PeriodeSelect'

const COLORS = [
  '#a1172f', '#2563eb', '#059669', '#d97706', '#7c3aed',
  '#dc2626', '#0891b2', '#4f46e5', '#ca8a04', '#be185d',
  '#16a34a', '#6366f1', '#0d9488', '#ea580c', '#8b5cf6',
]

export default function Statistik() {
  const perioder = usePerioder()
  const defaultPeriode = useDefaultPeriode(perioder.data)

  const [selectedPeriode, setSelectedPeriode] = useState<number | null>(null)
  const aktivPeriode = selectedPeriode ?? defaultPeriode
  const aktivLabel = perioder.data?.find((p) => p.id === aktivPeriode)
    ? periodeLabel(perioder.data.find((p) => p.id === aktivPeriode)!)
    : ''

  const sagerTotal = useSagerTotal()
  const afstemningerTotal = useAfstemningerTotal()
  const sagerPerType = useSagerPerType(aktivPeriode ?? undefined)
  const aktstykkerPerMinisterium = useAktstykkerPerMinisterium(aktivPeriode)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Statistik</h2>
          <p className="text-gray-500 text-sm">Overblik over data i Folketingets åbne data</p>
        </div>
        <PeriodeSelect
          perioder={perioder.data}
          value={aktivPeriode}
          onChange={setSelectedPeriode}
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
            title={`Sager fordelt efter type (${aktivLabel})`}
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

      {/* Bar chart: Aktstykker per ministerium */}
      {aktstykkerPerMinisterium.data && aktstykkerPerMinisterium.data.length > 0 && (
        <div className="mb-8">
          <BarChart
            title={`Aktstykker per ministerium (${aktivLabel})`}
            data={aktstykkerPerMinisterium.data.map((d, i) => ({
              label: d.label.replace('ministeriet', 'min.').replace('Ministeriet', 'Min.'),
              value: d.count,
              color: COLORS[i % COLORS.length],
            }))}
          />
        </div>
      )}
      {aktstykkerPerMinisterium.isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
