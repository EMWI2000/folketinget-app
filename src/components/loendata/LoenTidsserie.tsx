import { useMemo } from 'react'
import type { BenchmarkRaekke } from '../../lib/loendata/types'
import { COMPARE_COLORS } from '../../lib/loendata/types'
import {
  formatLoen,
  formatAarsvaerk,
  sorterPerioder,
  periodeTilIndex,
  indexTilKvartal,
} from '../../lib/loendata/parser'

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
          qIdx: periodeTilIndex(b.periode!) ?? 0,
          value: metric === 'samletLon' ? b.samletLon : b.aarsvaerk,
        }))
        .sort((a, b) => a.qIdx - b.qIdx)

      const label = navn.replace(/^§[\d.]+\s*-\s*/, '')

      return {
        navn,
        label,
        color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
        points,
      }
    })
  }, [benchmarkPerPeriode, selectedNavne, metric])

  const isLon = metric === 'samletLon'

  // Alle kvartaler der findes i data (på tværs af valgte konti)
  const dataPerioder = useMemo(
    () =>
      sorterPerioder([
        ...new Set(seriesData.flatMap((s) => s.points.map((p) => p.periode))),
      ]),
    [seriesData]
  )

  if (seriesData.length === 0 || dataPerioder.length === 0) {
    return null
  }

  const formatY = (val: number) => (isLon ? formatLoen(val) : formatAarsvaerk(val))

  const presentIdx = new Set(dataPerioder.map((p) => periodeTilIndex(p) ?? 0))
  const minIdx = Math.min(...presentIdx)
  const maxIdx = Math.max(...presentIdx)

  // Hvis der kun findes ét kvartal i data kan vi ikke vise en udvikling
  if (minIdx === maxIdx) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Udvikling over tid
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Der er kun data for én periode i denne tabelfordeling, så der er ingen
          udvikling at vise.
        </p>
      </div>
    )
  }

  // Alle kvartaler i intervallet – inkl. dem uden data (fx hele 2025)
  const axisIdx: number[] = []
  for (let i = minIdx; i <= maxIdx; i++) axisIdx.push(i)

  const allValues = seriesData.flatMap((s) => s.points.map((p) => p.value))
  const minVal = Math.min(0, ...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const width = 500
  const height = 220
  const padding = { top: 20, right: 20, bottom: 40, left: 70 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  // Tidsbaseret x-akse: position efter faktisk kvartal, ikke array-index
  const xScale = (qIdx: number) =>
    padding.left + ((qIdx - minIdx) / Math.max(maxIdx - minIdx, 1)) * chartW
  const yScale = (val: number) =>
    padding.top + chartH - ((val - minVal) / range) * chartH

  // Sammenhængende intervaller af kvartaler uden data (til skraveret bånd)
  const missingBands: { start: number; end: number }[] = []
  for (const i of axisIdx) {
    if (presentIdx.has(i)) continue
    const last = missingBands[missingBands.length - 1]
    if (last && last.end === i - 1) last.end = i
    else missingBands.push({ start: i, end: i })
  }

  // Undgå at overfylde aksen med labels hvis der er mange kvartaler
  const labelStep = axisIdx.length > 10 ? 2 : 1

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">
        Udvikling over tid – {isLon ? 'Samlet løn (kr./md.)' : 'Årsværk'}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Viser alle tilgængelige perioder (uafhængigt af periodevalget ovenfor).
        Stiplet linje krydser kvartaler uden data.
      </p>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Skravering for kvartaler uden data */}
        {missingBands.map((band) => {
          // Båndet dækker fra midt mellem forrige datapunkt til midt mod næste
          const x1 = xScale(band.start - 0.5)
          const x2 = xScale(band.end + 0.5)
          return (
            <rect
              key={`gap-${band.start}`}
              x={x1}
              y={padding.top}
              width={Math.max(x2 - x1, 0)}
              height={chartH}
              className="fill-amber-50 dark:fill-amber-900/10"
            />
          )
        })}

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const val = minVal + pct * range
          return (
            <g key={pct}>
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

        {/* X-akse labels – ét pr. kvartal i intervallet */}
        {axisIdx.map((qIdx, i) => {
          if (i % labelStep !== 0 && qIdx !== maxIdx) return null
          const har = presentIdx.has(qIdx)
          return (
            <text
              key={qIdx}
              x={xScale(qIdx)}
              y={height - 8}
              textAnchor="middle"
              className={
                har
                  ? 'text-[11px] fill-gray-600 dark:fill-gray-400'
                  : 'text-[10px] fill-gray-300 dark:fill-gray-600'
              }
            >
              {indexTilKvartal(qIdx)}
            </text>
          )
        })}

        {/* Linjer og punkter */}
        {seriesData.map((series) => (
          <g key={series.navn}>
            {/* Tegn segment for segment, så huller kan vises stiplet */}
            {series.points.slice(1).map((p, i) => {
              const prev = series.points[i]
              const gap = p.qIdx - prev.qIdx > 1
              return (
                <line
                  key={`${series.navn}-${p.periode}`}
                  x1={xScale(prev.qIdx)}
                  y1={yScale(prev.value)}
                  x2={xScale(p.qIdx)}
                  y2={yScale(p.value)}
                  stroke={series.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray={gap ? '4 4' : undefined}
                  opacity={gap ? 0.6 : 1}
                />
              )
            })}
            {series.points.map((p) => (
              <circle
                key={p.periode}
                cx={xScale(p.qIdx)}
                cy={yScale(p.value)}
                r={4}
                fill={series.color}
                strokeWidth={1.5}
                className="stroke-white dark:stroke-gray-800"
              >
                <title>
                  {series.label}: {formatY(p.value)} ({p.periode})
                </title>
              </circle>
            ))}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {seriesData.map((s) => (
          <div key={s.navn} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
