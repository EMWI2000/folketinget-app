import type { Afstemning } from '../types/ft'

function formatDato(dato: string): string {
  return new Date(dato).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AfstemningKort({ afstemning }: { afstemning: Afstemning }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            afstemning.vedtaget
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {afstemning.vedtaget ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {afstemning.vedtaget ? 'Vedtaget' : 'Forkastet'}
        </span>
        <span className="text-xs text-gray-400">Nr. {afstemning.nummer}</span>
      </div>
      <p className="text-sm text-gray-700 line-clamp-3 mb-2">{afstemning.konklusion}</p>
      {afstemning.kommentar && (
        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mb-2">
          {afstemning.kommentar}
        </p>
      )}
      <p className="text-xs text-gray-400">{formatDato(afstemning.opdateringsdato)}</p>
    </div>
  )
}
