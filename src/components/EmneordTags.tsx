import { useNavigate } from 'react-router-dom'
import type { Emneord } from '../types/ft'

export default function EmneordTags({ emneord }: { emneord: Emneord[] }) {
  const navigate = useNavigate()

  if (emneord.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Emneord
      </h2>
      <div className="flex flex-wrap gap-2">
        {emneord.map((e) => (
          <button
            key={e.id}
            onClick={() => navigate(`/soeg?q=${encodeURIComponent(e.emneord)}`)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            {e.emneord}
          </button>
        ))}
      </div>
    </div>
  )
}
