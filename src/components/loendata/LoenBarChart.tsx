import type { BenchmarkRaekke } from '../../lib/loendata/types'
import { COMPARE_COLORS } from '../../lib/loendata/types'
import { formatLoen, formatAarsvaerk } from '../../lib/loendata/parser'

interface LoenBarChartProps {
  data: BenchmarkRaekke[]
  selectedNavne: string[]
  metric: 'samletLon' | 'aarsvaerk'
}

export default function LoenBarChart({ data, selectedNavne, metric }: LoenBarChartProps) {
  const selectedData = data.filter((d) => selectedNavne.includes(d.navn))

  if (selectedData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>Vælg hovedkonti fra tabellen for at sammenligne.</p>
      </div>
    )
  }

  const maxValue = Math.max(...selectedData.map((d) => d[metric]))
  const isLon = metric === 'samletLon'
  const chartTitle = isLon ? 'Samlet løn (vægtet gns. kr./md.)' : 'Årsværk (sum)'

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4"
      role="img"
      aria-label={`${chartTitle}: søjlediagram med ${selectedData.length} sammenligninger`}
    >
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {chartTitle}
      </h3>
      <div className="space-y-3">
        {[...selectedData]
          .sort((a, b) => b[metric] - a[metric])
          .map((row) => {
            const idx = selectedNavne.indexOf(row.navn)
            const color = COMPARE_COLORS[idx % COMPARE_COLORS.length]
            const width = (row[metric] / maxValue) * 100
            const label = row.navn.replace(/^§[\d.]+\s*-\s*/, '')

            return (
              <div key={row.navn}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]" title={row.navn}>
                    {label}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 font-mono ml-2">
                    {isLon ? `${formatLoen(row.samletLon)} kr.` : formatAarsvaerk(row.aarsvaerk)}
                  </span>
                </div>
                <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: `${width}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
      </div>

      {/* Skærmlæser-datatabel */}
      <table className="sr-only">
        <caption>{chartTitle}</caption>
        <thead>
          <tr>
            <th scope="col">Konto</th>
            <th scope="col">{isLon ? 'Samlet løn (kr./md.)' : 'Årsværk'}</th>
          </tr>
        </thead>
        <tbody>
          {[...selectedData]
            .sort((a, b) => b[metric] - a[metric])
            .map((row) => (
              <tr key={row.navn}>
                <td>{row.navn}</td>
                <td>{isLon ? `${formatLoen(row.samletLon)} kr.` : formatAarsvaerk(row.aarsvaerk)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
