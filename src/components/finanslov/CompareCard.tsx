import type { BudgetNode } from '../../lib/finanslov/types'
import { formatBudgetValue, formatChange } from '../../lib/finanslov/formatter'

interface CompareCardProps {
  node: BudgetNode
  color: string
  onRemove: () => void
  previousYearNode?: BudgetNode | null
}

export default function CompareCard({ node, color, onRemove, previousYearNode }: CompareCardProps) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow border-l-4 p-4 relative"
      style={{ borderLeftColor: color }}
    >
      {/* Fjern-knap */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
        title="Fjern fra sammenligning"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="pr-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold" style={{ color }}>
            {node.code}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {node.year}
          </span>
        </div>
        <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight mb-3">
          {node.name}
        </h4>
      </div>

      {/* Værdier */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {/* Regnskab */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Regnskab (R)</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatBudgetValue(node.values.R)}
          </div>
        </div>

        {/* Budget fra forrige */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Tidl. budget (B)</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatBudgetValue(node.values.B)}
          </div>
        </div>

        {/* Bevilling */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Bevilling (F)</div>
          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {formatBudgetValue(node.values.F)}
            {previousYearNode && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  node.values.F > previousYearNode.values.F
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : node.values.F < previousYearNode.values.F
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {formatChange(previousYearNode.values.F, node.values.F)}
              </span>
            )}
          </div>
        </div>

        {/* Budgetoverslag */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">BO1</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatBudgetValue(node.values.BO1)}
          </div>
        </div>
      </div>

      {/* Mini-bar for F-værdi */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                backgroundColor: color,
                width: `${Math.min(100, Math.abs(node.values.F) / 10000 * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
