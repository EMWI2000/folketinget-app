interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  title: string
}

export default function BarChart({ data, title }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-36 text-sm text-gray-600 text-right shrink-0 truncate" title={item.label}>
              {item.label}
            </div>
            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max((item.value / max) * 100, 2)}%`,
                  backgroundColor: item.color || '#a1172f',
                }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700">
                {item.value.toLocaleString('da-DK')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
