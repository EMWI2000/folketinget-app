import type { CompareItem } from '../../lib/finanslov/types'
import { formatBudgetCompact, formatDanishNumber } from '../../lib/finanslov/formatter'

interface BudgetBarProps {
  items: CompareItem[]
  valueKey?: 'F' | 'R' | 'B' | 'BO1' | 'BO2' | 'BO3'
  title?: string
}

export default function BudgetBar({
  items,
  valueKey = 'F',
  title = 'Sammenligning',
}: BudgetBarProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{title}</h4>
        <div className="h-[150px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          Vælg konti for at sammenligne
        </div>
      </div>
    )
  }

  // Find max absolut værdi for skala
  const maxAbsValue = Math.max(...items.map((item) => Math.abs(item.node.values[valueKey])), 1)

  // Sortér efter værdi (største først)
  const sortedItems = [...items].sort(
    (a, b) => Math.abs(b.node.values[valueKey]) - Math.abs(a.node.values[valueKey])
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{title}</h4>

      <div className="space-y-3">
        {sortedItems.map((item) => {
          const value = item.node.values[valueKey]
          const widthPercent = (Math.abs(value) / maxAbsValue) * 100
          const isNegative = value < 0

          return (
            <div key={item.node.id}>
              {/* Label */}
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                  <span className="font-mono font-bold mr-1" style={{ color: item.color }}>
                    {item.node.code}
                  </span>
                  {item.node.name}
                </span>
                <span
                  className={`font-medium tabular-nums ${
                    isNegative
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {formatBudgetCompact(value)}
                </span>
              </div>

              {/* Bar */}
              <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.max(widthPercent, 2)}%`,
                    backgroundColor: isNegative ? '#059669' : item.color, // emerald for negative (indtægter)
                  }}
                >
                  {widthPercent > 15 && (
                    <span className="text-white text-xs font-medium">
                      {formatDanishNumber(Math.abs(value), 0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Forklaring */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-600" />
            <span>Indtægt</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-400" />
            <span>Udgift</span>
          </div>
        </div>
      </div>
    </div>
  )
}
