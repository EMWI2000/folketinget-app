import { useMemo } from 'react'
import type { BenchmarkRaekke } from '../../lib/loendata/types'
import { COMPARE_COLORS } from '../../lib/loendata/types'
import { formatLoen, formatAarsvaerk, sorterPerioder } from '../../lib/loendata/parser'

interface LoenTidsserieProps {
  benchmarkPerPeriode: BenchmarkRaekke[]
  selectedNavne: string[]
  metric: 'samletLon' | 'aarsvaerk'
}

export default function LoenTidsserie({ benchmarkPerPeriode, selectedNavne, metric }: LoenTidsserieProps) {
  const seriesData = useMemo(() => {
    if (selectedNavne.length === 0) return []

    return selectedNavne.map((navn, idx) => {
      const points = benchmarkPerPeriode
        .filter((b) => b.navn === navn && b.periode)
        .map((b) => ({
          periode: b.periode!,
          value: metric === 'samletLon' ? b.samletLon : b.aarsvaerk,
        }))

      // Sortér kronologisk
      const sortedPerioder = sorterPerioder(points.map((p) => p.periode))
      const sorted = sortedPerioder
        .map((p) => points.find((pt) => pt.periode === p))
        .filter((p): p is NonNullable<typeof p> => p != null)

      const label = navn.replace(/^§[\d.]+\s*-\s*/, '')

      return {
        navn,
        label,
        color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
        points: sorted,
      }
    })
  }, [benchmarkPerPeriode, selectedNavne, metric])

  if (seriesData.length === 0 || seriesData.every((s) => s.points.length < 2)) {
    return null // Vis ikke graf hvis der kun er ét datapunkt
  }

  const allPerioder = sorterPerioder([
    ...new Set(seriesData.flatMap((s) => s.points.map((p) => p.periode))),
  ])
  const allValues = seriesData.flatMap((s) => s.points.map((p) => p.value))
  const minVal = Math.min(0, ...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const width = 500
  const height = 220
  const padding = { top: 20, right: 20, bottom: 40, left: 70 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const xScale = (idx: number) =>
    padding.left + (idx / Math.max(allPerioder.length - 1, 1)) * chartW

  const yScale = (val: number) =>
    padding.top + chartH - ((val - minVal) / range) * chartH

  const isLon = metric === 'samletLon'

  const formatY = (val: number) => {
    if (isLon) return formatLoen(val)
    return formatAarsvaerk(val)
  }

  const chartTitle = `Udvikling over tid – ${isLon ? 'Samlet løn (kr./md.)' : 'Årsværk'}`
  const svgTitleId = 'loen-tidsserie-title'
  const svgDescId = 'loen-tidsserie-desc'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {chartTitle}
      </h3>

      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        role="img"
        aria-labelledby={`${svgTitleId} ${svgDescId}`}
      >
        <title id={svgTitleId}>{chartTitle}</title>
        <desc id={svgDescId}>
          Linjediagram med {seriesData.length} serie{seriesData.length !== 1 ? 'r' : ''} over {allPerioder.length} perioder ({allPerioder[0]}–{allPerioder[allPerioder.length - 1]})
        </desc>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const val = minVal + pct * range
          return (
            <g key={pct} aria-hidden="true">
              <line
                x1={padding.left}
                y1={yScale(val)}
                x2={width - padding.right}
                y2={yScale(val)}
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-700"
              />
              <text
                x={padding.left - 8}
                y={yScale(val)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[10px] fill-gray-500 dark:fill-gray-400"
              >
                {formatY(val)}
              </text>
            </g>
          )
        })}

        {/* X-akse labels */}
        {allPerioder.map((p, i) => {
          // Forkortet label: "2025, 3. kvt." → "Q3 2025"
          const m = p.match(/(\d{4}),\s*(\d)/)
          const short = m ? `Q${m[2]} ${m[1]}` : p

          return (
            <text
              key={p}
              x={xScale(i)}
              y={height - 8}
              textAnchor="middle"
              className="text-[11px] fill-gray-600 dark:fill-gray-400"
              aria-hidden="true"
            >
              {short}
            </text>
          )
        })}

        {/* Linjer og punkter */}
        {seriesData.map((series) => {
          if (series.points.length < 2) return null

          const pathD = series.points
            .map((p, i) => {
              const xIdx = allPerioder.indexOf(p.periode)
              return `${i === 0 ? 'M' : 'L'} ${xScale(xIdx)} ${yScale(p.value)}`
            })
            .join(' ')

          return (
            <g key={series.navn}>
              <path
                d={pathD}
                fill="none"
                stroke={series.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              />
              {series.points.map((p) => {
                const xIdx = allPerioder.indexOf(p.periode)
                return (
                  <circle
                    key={p.periode}
                    cx={xScale(xIdx)}
                    cy={yScale(p.value)}
                    r={4}
                    fill={series.color}
                    stroke="white"
                    strokeWidth={1.5}
                  >
                    <title>
                      {series.label}: {formatY(p.value)} ({p.periode})
                    </title>
                  </circle>
                )
              })}
            </g>
          )
        })}
      </svg>

      {/* Skærmlæser-datatabel */}
      <table className="sr-only">
        <caption>{chartTitle}</caption>
        <thead>
          <tr>
            <th scope="col">Konto</th>
            {allPerioder.map((p) => (
              <th key={p} scope="col">{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {seriesData.map((series) => (
            <tr key={series.navn}>
              <td>{series.navn}</td>
              {allPerioder.map((p) => {
                const point = series.points.find((pt) => pt.periode === p)
                return <td key={p}>{point ? formatY(point.value) : '–'}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {seriesData.map((s) => (
          <div key={s.navn} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
