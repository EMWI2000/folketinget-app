import { useParams, Link } from 'react-router-dom'
import { useSag } from '../hooks/useSager'
import { SAG_TYPER, SAG_STATUS } from '../types/ft'

function formatDato(dato: string): string {
  return new Date(dato).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
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

export default function SagSide() {
  const { id } = useParams<{ id: string }>()
  const { data: sag, isLoading, error } = useSag(id ? Number(id) : null)

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
    )
  }

  if (error || !sag) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-2">Kunne ikke hente sagen</p>
        <Link to="/" className="text-ft-red hover:underline text-sm">Tilbage til dashboard</Link>
      </div>
    )
  }

  const sagstrin = sag.Sagstrin
    ? [...sag.Sagstrin].sort((a, b) => new Date(a.dato).getTime() - new Date(b.dato).getTime())
    : []

  return (
    <div>
      <Link
        to={-1 as unknown as string}
        onClick={(e) => { e.preventDefault(); window.history.back() }}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-ft-red mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tilbage
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-3 flex-wrap mb-4">
          <span className="text-sm font-mono font-semibold text-ft-red bg-ft-red/10 px-3 py-1 rounded">
            {sag.nummer || sag.nummerprefix}
          </span>
          {SAG_TYPER[sag.typeid] && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
              {SAG_TYPER[sag.typeid]}
            </span>
          )}
          <span className={`text-sm px-3 py-1 rounded font-medium ${getStatusColor(sag.statusid)}`}>
            {SAG_STATUS[sag.statusid] || `Status ${sag.statusid}`}
          </span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">{sag.titel}</h1>

        {sag.resume && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Resume</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{sag.resume}</p>
          </div>
        )}

        {sag.afstemningskonklusion && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Afstemningskonklusion</h3>
            <p className="text-sm text-blue-700">{sag.afstemningskonklusion}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Opdateret</span>
            <p className="font-medium text-gray-900">{formatDato(sag.opdateringsdato)}</p>
          </div>
          {sag.retsinformationsurl && (
            <div>
              <span className="text-gray-500">Retsinformation</span>
              <p>
                <a
                  href={sag.retsinformationsurl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ft-red hover:underline"
                >
                  Se lov &rarr;
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sagstrin tidslinje */}
      {sagstrin.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Behandlingsforløb</h2>
          <div className="relative">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {sagstrin.map((trin, idx) => (
                <div key={trin.id} className="relative pl-8">
                  <div
                    className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                      idx === sagstrin.length - 1
                        ? 'bg-ft-red border-ft-red'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{trin.titel}</p>
                    <p className="text-xs text-gray-500">{formatDato(trin.dato)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
