import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import type { WatchItem } from '../lib/watchlist'

const typeLabels: Record<WatchItem['type'], string> = {
  ministerium: 'Ministerium',
  sagstype: 'Sagstype',
  emneord: 'Emneord',
  fritekst: 'Fritekst',
}

const typeColors: Record<WatchItem['type'], string> = {
  ministerium: 'bg-blue-100 text-blue-700',
  sagstype: 'bg-purple-100 text-purple-700',
  emneord: 'bg-green-100 text-green-700',
  fritekst: 'bg-amber-100 text-amber-700',
}

export default function WatchlistPanel() {
  const { items, add, remove } = useWatchlist()
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<WatchItem['type']>('fritekst')
  const navigate = useNavigate()

  const handleAdd = () => {
    if (newLabel.trim()) {
      add({ label: newLabel.trim(), type: newType })
      setNewLabel('')
      setShowAdd(false)
    }
  }

  const handleClick = (item: WatchItem) => {
    if (item.type === 'ministerium') {
      navigate('/aktstykker')
    } else {
      navigate(`/soeg?q=${encodeURIComponent(item.label)}`)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Mine overvågninger
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-ft-red hover:text-ft-red-dark font-medium transition-colors"
        >
          {showAdd ? 'Annullér' : '+ Tilføj'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="F.eks. 'digitalisering' eller 'Sundhedsmin.'"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ft-red/30"
          />
          <div className="flex items-center gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as WatchItem['type'])}
              className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="fritekst">Fritekst</option>
              <option value="ministerium">Ministerium</option>
              <option value="emneord">Emneord</option>
              <option value="sagstype">Sagstype</option>
            </select>
            <button
              onClick={handleAdd}
              className="px-3 py-1 text-xs bg-ft-red text-white rounded-lg hover:bg-ft-red-dark transition-colors font-medium"
            >
              Tilføj
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
          Ingen overvågninger endnu. Tilføj nøgleord eller ministerier du vil følge.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 group"
            >
              <button
                onClick={() => handleClick(item)}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-ft-red transition-colors text-left flex-1 min-w-0"
              >
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${typeColors[item.type]}`}>
                  {typeLabels[item.type]}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
              <button
                onClick={() => remove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                title="Fjern"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
