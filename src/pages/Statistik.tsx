import { useState } from 'react'
import { useSagerTotal, useAfstemningerTotal, useSagerPerType, useAktstykkerPerMinisterium, useAlmDelOpdelt, useLovforslagPerStatus } from '../hooks/useStatistik'
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

// Farver specifikt til status
const STATUS_COLORS: Record<string, string> = {
  'Vedtaget': '#059669',      // grøn
  'Forkastet': '#dc2626',     // rød
  'Under behandling': '#2563eb', // blå
  'Fremsat': '#d97706',       // orange
  'Bortfaldet': '#6b7280',    // grå
  'Afsluttet': '#0891b2',     // cyan
  'Modtaget': '#7c3aed',      // lilla
}

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
  const almDelOpdelt = useAlmDelOpdelt(aktivPeriode ?? undefined)
  const lovforslagPerStatus = useLovforslagPerStatus(aktivPeriode ?? undefined)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Statistik</h2>
          <p className="text-gray-500 text-sm">Statistik for den valgte folketingssamling. Sager fordelt efter type og aktstykker fordelt efter ansvarligt ministerium.</p>
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

      {/* Gitter med grafer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sager per type */}
        {sagerPerType.data && (
          <BarChart
            title={`Sager fordelt efter type (${aktivLabel})`}
            data={sagerPerType.data.map((d, i) => ({
              label: d.label,
              value: d.count,
              color: COLORS[i % COLORS.length],
            }))}
          />
        )}
        {sagerPerType.isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        )}

        {/* Lovforslag per status */}
        {lovforslagPerStatus.data && lovforslagPerStatus.data.length > 0 && (
          <BarChart
            title={`Lovforslag efter status (${aktivLabel})`}
            data={lovforslagPerStatus.data.map((d) => ({
              label: d.label,
              value: d.count,
              color: STATUS_COLORS[d.label] || COLORS[0],
            }))}
          />
        )}
        {lovforslagPerStatus.isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Alm. del opdelt */}
        {almDelOpdelt.data && almDelOpdelt.data.length > 0 && (
          <BarChart
            title={`Alm. del opdelt (${aktivLabel})`}
            subtitle="Spørgsmål, samråd og andre henvendelser"
            data={almDelOpdelt.data.map((d, i) => ({
              label: d.label,
              value: d.count,
              color: COLORS[i % COLORS.length],
            }))}
          />
        )}
        {almDelOpdelt.isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        )}

        {/* Aktstykker per ministerium */}
        {aktstykkerPerMinisterium.data && aktstykkerPerMinisterium.data.length > 0 && (
          <BarChart
            title={`Aktstykker per ministerium (${aktivLabel})`}
            data={aktstykkerPerMinisterium.data.map((d, i) => ({
              label: d.label.replace('ministeriet', 'min.').replace('Ministeriet', 'Min.'),
              value: d.count,
              color: COLORS[i % COLORS.length],
            }))}
          />
        )}
        {aktstykkerPerMinisterium.isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
