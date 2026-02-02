import { useState } from 'react'

export default function AiSammenfatning() {
  const [tekst, setTekst] = useState('')
  const [resultat, setResultat] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyse = () => {
    if (!tekst.trim()) return
    setLoading(true)

    // Simpel mønstergenkendelse for beløb og bevillingsmodtagere
    const lines = tekst.split('\n').filter((l) => l.trim())
    const beløbPattern = /(\d[\d.,]+)\s*(mio\.?|mia\.?|kr\.?|mill?\.?|tusind)/gi
    const findings: string[] = []

    for (const line of lines) {
      const matches = line.match(beløbPattern)
      if (matches) {
        findings.push(`• ${line.trim().substring(0, 200)}`)
      }
    }

    // Søg efter specifikke nøgleord
    const keywordPattern = /(?:bevilling|tilskud|overførsel|udgift|indtægt|rådighedsbeløb|anlægsbevilling|lån|garanti|driftsbevilling)/gi
    for (const line of lines) {
      if (keywordPattern.test(line) && !findings.includes(`• ${line.trim().substring(0, 200)}`)) {
        findings.push(`• ${line.trim().substring(0, 200)}`)
      }
    }

    setTimeout(() => {
      if (findings.length > 0) {
        setResultat(
          `Fundet ${findings.length} relevante linjer med beløb eller bevillingstermer:\n\n${findings.slice(0, 20).join('\n')}`
        )
      } else {
        setResultat('Ingen tydelige beløb eller bevillingstermer fundet i den indsatte tekst. Prøv at indsætte teksten fra selve aktstykke-PDFen.')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Søg i aktstykke-tekst
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Kopiér teksten fra et aktstykke-PDF og indsæt herunder. Værktøjet finder automatisk linjer med beløb og bevillingstermer.
      </p>

      <textarea
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="Indsæt tekst fra et aktstykke-PDF her..."
        rows={8}
        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ft-red/30 resize-y mb-3"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleAnalyse}
          disabled={loading || !tekst.trim()}
          className="px-4 py-2 bg-ft-red text-white rounded-lg hover:bg-ft-red-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyserer...' : 'Find beløb og bevillinger'}
        </button>
        {tekst && (
          <button
            onClick={() => { setTekst(''); setResultat(null) }}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Ryd
          </button>
        )}
      </div>

      {resultat && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{resultat}</pre>
        </div>
      )}
    </div>
  )
}
