import { Link } from 'react-router-dom'
import type { Sag } from '../types/ft'
import { SAG_TYPER, SAG_STATUS } from '../types/ft'

function formatDato(dato: string): string {
  return new Date(dato).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusColor(statusid: number): string {
  switch (statusid) {
    case 20: return 'bg-green-100 text-green-800'
    case 28: return 'bg-red-100 text-red-800'
    case 12: case 17: return 'bg-blue-100 text-blue-800'
    case 25: return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function SagKort({ sag }: { sag: Sag }) {
  return (
    <Link
      to={`/sag/${sag.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-ft-red/20 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-semibold text-ft-red bg-ft-red/10 px-2 py-0.5 rounded">
            {sag.nummer || sag.nummerprefix}
          </span>
          {SAG_TYPER[sag.typeid] && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {SAG_TYPER[sag.typeid]}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${getStatusColor(sag.statusid)}`}>
          {SAG_STATUS[sag.statusid] || `Status ${sag.statusid}`}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-ft-red transition-colors line-clamp-2 mb-2">
        {sag.titelkort || sag.titel}
      </h3>
      {sag.resume && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{sag.resume}</p>
      )}
      <p className="text-xs text-gray-400">
        Opdateret {formatDato(sag.opdateringsdato)}
      </p>
    </Link>
  )
}
