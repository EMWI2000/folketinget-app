import { SAG_TYPER } from '../types/ft'

interface FilterPanelProps {
  selectedType: number | null
  onTypeChange: (type: number | null) => void
}

export default function FilterPanel({ selectedType, onTypeChange }: FilterPanelProps) {
  const typer = Object.entries(SAG_TYPER).map(([id, label]) => ({
    id: Number(id),
    label,
  }))

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onTypeChange(null)}
        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
          selectedType === null
            ? 'bg-ft-red text-white'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-ft-red/30'
        }`}
      >
        Alle typer
      </button>
      {typer.map((type) => (
        <button
          key={type.id}
          onClick={() => onTypeChange(type.id === selectedType ? null : type.id)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            selectedType === type.id
              ? 'bg-ft-red text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-ft-red/30'
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}
