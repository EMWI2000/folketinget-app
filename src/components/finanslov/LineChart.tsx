import { useMemo, useState } from 'react'
import type { CompareItem, FinanslovData } from '../../lib/finanslov/types'
import { formatBudgetCompact } from '../../lib/finanslov/formatter'

interface LineChartProps {
  items: CompareItem[]
  allData: Map<number, FinanslovData>
  valueKey?: 'F' | 'R' | 'B' | 'BO1' | 'BO2' | 'BO3'
  title?: string
}

const YEARS = [2024, 2025, 2026]

export default function LineChart({
  items,
  allData,
  valueKey = 'F',
  title = 'Bevilling over tid',
}: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    item: CompareItem
    year: number
    value: number
    x: number
    y: number
  } | null>(null)

  // Byg datalinjer for hvert item
  const lines = useMemo(() => {
    return items.map((item) => {
      const points = YEARS.map((year) => {
        const yearData = allData.get(year)
        const node = yearData?.index[item.node.code]
        return {
          year,
          value: node?.values[valueKey] ?? 0,
        }
      })
      return { item, points }
    })
  }, [items, allData, valueKey])

  // Find min/max for skala
  const { minValue, maxValue } = useMemo(() => {
    let min = 0
    let max = 0
    for (const line of lines) {
      for (const point of line.points) {
        if (point.value < min) min = point.value
        if (point.value > max) max = point.value
      }
    }
    // Tilføj margin
    const range = max - min || 1
    return {
      minValue: min - range * 0.1,
      maxValue: max + range * 0.1,
    }
  }, [lines])

  // SVG dimensioner
  const width = 400
  const height = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Skala-funktioner
  const xScale = (year: number) =>
    padding.left + ((year - 2024) / 2) * chartWidth
  const yScale = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight

  // Generer Y-akse ticks
  const yTicks = useMemo(() => {
    const range = maxValue - minValue
    const tickCount = 5
    const step = range / (tickCount - 1)
    return Array.from({ length: tickCount }, (_, i) => minValue + i * step)
  }, [minValue, maxValue])

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{title}</h4>
        <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          Vælg konti for at se udvikling
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{title}</h4>

      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Gridlines */}
          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke="currentColor"
              className="text-gray-100 dark:text-gray-700"
              strokeWidth={1}
            />
          ))}

          {/* Y-akse labels */}
          {yTicks.map((tick) => (
            <text
              key={tick}
              x={padding.left - 8}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-[10px] fill-gray-500 dark:fill-gray-400"
            >
              {formatBudgetCompact(tick)}
            </text>
          ))}

          {/* X-akse labels */}
          {YEARS.map((year) => (
            <text
              key={year}
              x={xScale(year)}
              y={height - 8}
              textAnchor="middle"
              className="text-[11px] fill-gray-600 dark:fill-gray-400 font-medium"
            >
              {year}
            </text>
          ))}

          {/* Linjer */}
          {lines.map((line) => {
            const pathD = line.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.year)} ${yScale(p.value)}`)
              .join(' ')

            return (
              <g key={line.item.node.id}>
                {/* Linje */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={line.item.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Punkter */}
                {line.points.map((p) => (
                  <circle
                    key={p.year}
                    cx={xScale(p.year)}
                    cy={yScale(p.value)}
                    r={5}
                    fill={line.item.color}
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHoveredPoint({
                        item: line.item,
                        year: p.year,
                        value: p.value,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      })
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
            style={{
              left: hoveredPoint.x,
              top: hoveredPoint.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-medium">{hoveredPoint.item.node.name}</div>
            <div className="text-gray-300">
              {hoveredPoint.year}: {formatBudgetCompact(hoveredPoint.value)}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
        {items.map((item) => (
          <div key={item.node.id} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
              {item.node.code} {item.node.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
