interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  title: string
  subtitle?: string
}

export default function BarChart({ data, title, subtitle }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-36 text-sm text-gray-600 dark:text-gray-400 text-right shrink-0 truncate" title={item.label}>
              {item.label}
            </div>
            <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max((item.value / max) * 100, 2)}%`,
                  backgroundColor: item.color || '#a1172f',
                }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                {item.value.toLocaleString('da-DK')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
