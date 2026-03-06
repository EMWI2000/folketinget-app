import type { BenchmarkRaekke } from '../../lib/loendata/types'
import { LOEN_KOMPONENTER, COMPARE_COLORS } from '../../lib/loendata/types'
import { formatLoen } from '../../lib/loendata/parser'

interface LoenKomponentChartProps {
  data: BenchmarkRaekke[]
  selectedNavne: string[]
}

export default function LoenKomponentChart({ data, selectedNavne }: LoenKomponentChartProps) {
  const selectedData = data.filter((d) => selectedNavne.includes(d.navn))

  if (selectedData.length === 0) return null

  const width = 500
  const barHeight = 28
  const gap = 8
  const labelWidth = 140
  const padding = { top: 30, right: 20, bottom: 10, left: labelWidth }
  const chartW = width - padding.left - padding.right

  // Beregn max samlet løn (for at skalere alle bars ens)
  const maxTotal = Math.max(...selectedData.map((d) => d.samletLon))

  const totalHeight = padding.top + selectedData.length * (barHeight + gap) + padding.bottom

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Lønsammensætning (kr./md.)
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Vægtet gennemsnit opdelt på lønkomponenter
      </p>

      <svg width="100%" viewBox={`0 0 ${width} ${totalHeight}`} className="overflow-visible">
        {selectedData.map((row, i) => {
          const y = padding.top + i * (barHeight + gap)
          const idx = selectedNavne.indexOf(row.navn)
          const borderColor = COMPARE_COLORS[idx % COMPARE_COLORS.length]
          const label = row.navn.replace(/^§[\d.]+\s*-\s*/, '')

          // Byg stacked segments
          let xOffset = 0
          const segments = LOEN_KOMPONENTER.map((komp) => {
            const value = row[komp.key] as number
            const w = maxTotal > 0 ? (Math.max(0, value) / maxTotal) * chartW : 0
            const segment = {
              key: komp.key,
              label: komp.label,
              color: komp.color,
              value,
              x: padding.left + xOffset,
              w,
            }
            xOffset += w
            return segment
          }).filter((s) => s.w > 0)

          return (
            <g key={row.navn}>
              {/* Label */}
              <text
                x={padding.left - 6}
                y={y + barHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[11px] fill-gray-700 dark:fill-gray-300"
              >
                {label.length > 20 ? label.slice(0, 20) + '...' : label}
              </text>

              {/* Farvet border-indikator */}
              <rect
                x={padding.left - 3}
                y={y}
                width={3}
                height={barHeight}
                rx={1.5}
                fill={borderColor}
              />

              {/* Stacked segments */}
              {segments.map((seg) => (
                <rect
                  key={seg.key}
                  x={seg.x}
                  y={y}
                  width={seg.w}
                  height={barHeight}
                  fill={seg.color}
                  opacity={0.85}
                >
                  <title>
                    {seg.label}: {formatLoen(seg.value)} kr.
                  </title>
                </rect>
              ))}

              {/* Total label */}
              <text
                x={padding.left + xOffset + 6}
                y={y + barHeight / 2}
                dominantBaseline="middle"
                className="text-[10px] fill-gray-600 dark:fill-gray-400 font-mono"
              >
                {formatLoen(row.samletLon)} kr.
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        {LOEN_KOMPONENTER.map((komp) => (
          <div key={komp.key} className="flex items-center gap-1 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: komp.color, opacity: 0.85 }} />
            <span className="text-gray-500 dark:text-gray-400">{komp.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
