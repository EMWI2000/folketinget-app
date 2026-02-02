interface StatKortProps {
  label: string
  value: number | string | undefined
  icon: React.ReactNode
  loading?: boolean
  color?: 'red' | 'green' | 'blue' | 'amber'
}

const colorMap = {
  red: 'bg-ft-red/10 text-ft-red',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
}

export default function StatKort({ label, value, icon, loading, color = 'red' }: StatKortProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString('da-DK') : value ?? '–'}
          </p>
        )}
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}
