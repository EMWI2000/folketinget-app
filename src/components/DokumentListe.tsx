import type { Dokument } from '../types/ft'

function formatDato(dato: string): string {
  return new Date(dato).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getFileIcon(format: string): string {
  switch (format?.toUpperCase()) {
    case 'PDF': return '📄'
    case 'DOCX': case 'DOC': return '📝'
    case 'XLSX': case 'XLS': return '📊'
    default: return '📎'
  }
}

export default function DokumentListe({ dokumenter }: { dokumenter: Dokument[] }) {
  if (dokumenter.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Dokumenter ({dokumenter.length})
      </h2>
      <div className="space-y-2">
        {dokumenter.map((dok) => (
          <div
            key={dok.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{dok.titel}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDato(dok.dato)}</p>
            </div>
            {dok.Fil && dok.Fil.length > 0 && (
              <div className="flex gap-2 shrink-0">
                {dok.Fil.map((fil) => (
                  <a
                    key={fil.id}
                    href={fil.filurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-ft-red/10 text-ft-red hover:bg-ft-red/20 transition-colors"
                    title={`Åbn ${fil.format}`}
                  >
                    <span>{getFileIcon(fil.format)}</span>
                    {fil.format || 'Åbn'}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
