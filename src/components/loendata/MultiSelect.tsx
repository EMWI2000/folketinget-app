import { useState, useRef, useEffect } from 'react'

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export default function MultiSelect({ label, options, selected, onChange, placeholder }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500">{placeholder || 'Alle'}</span>
        ) : (
          <span className="text-gray-900 dark:text-white">
            {selected.length} valgt
          </span>
        )}
        <svg className="w-4 h-4 inline float-right mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Søgefelt */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg..."
              className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
              autoFocus
            />
          </div>

          {/* Vælg alle / Ryd */}
          <div className="flex gap-2 px-2 py-1.5 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => onChange(filtered)}
              className="text-xs text-ft-red hover:underline"
            >
              Vælg alle ({filtered.length})
            </button>
            <button
              onClick={() => onChange([])}
              className="text-xs text-gray-500 hover:underline"
            >
              Ryd
            </button>
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-44">
            {filtered.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                  className="rounded border-gray-300 dark:border-gray-600 text-ft-red focus:ring-ft-red"
                />
                <span className="text-gray-700 dark:text-gray-300 truncate">{option}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">Ingen resultater</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
