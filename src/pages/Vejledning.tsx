import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function Vejledning() {
  const [openSection, setOpenSection] = useState<string | null>('intro')

  const sections: Section[] = [
    {
      id: 'intro',
      title: 'Om denne side',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          <p>
            Denne side samler data fra <strong>Folketingets Åbne Data API</strong> og <strong>Økonomistyrelsens databaser</strong>
            for at give et overblik over parlamentarisk aktivitet og statsfinanserne.
          </p>
          <p>
            Siden er udviklet som en demo/prototype og er ikke officiel. Data hentes direkte fra de officielle kilder,
            men præsentationen og analyserne er uafhængige.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <strong>Datakilder:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 text-blue-800 dark:text-blue-200">
              <li><a href="https://oda.ft.dk" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">oda.ft.dk</a> - Folketingets Åbne Data API</li>
              <li><a href="https://oes.dk" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Økonomistyrelsen</a> - Finanslov- og Regnskabsdatabasen</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'sager',
      title: 'Søg i sager',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          <p>
            Søg i alle sager fra Folketinget: lovforslag, beslutningsforslag, forespørgsler, § 20-spørgsmål og mere.
          </p>
          <p><strong>Sagstyper:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Lovforslag (L)</strong> - Forslag til nye love eller ændringer af eksisterende</li>
            <li><strong>Beslutningsforslag (B)</strong> - Forslag der pålægger regeringen at handle</li>
            <li><strong>Forespørgsler (F)</strong> - Debatter om aktuelle emner</li>
            <li><strong>§ 20-spørgsmål</strong> - Skriftlige spørgsmål til ministrene</li>
            <li><strong>Alm. del</strong> - Almindelige henvendelser og spørgsmål til udvalg</li>
            <li><strong>Borgerforslag</strong> - Forslag fremsat af borgere med 50.000 støtter</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Klik på en sag for at se detaljer: sagstrin, dokumenter, aktører og emneord.
          </p>
        </div>
      ),
    },
    {
      id: 'bevillinger',
      title: 'Bevillinger (Aktstykker)',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          <p>
            <strong>Aktstykker</strong> er bevillingsanmodninger fra ministerierne til Folketingets Finansudvalg.
          </p>
          <p>
            Når et ministerium har brug for ekstra midler udover finansloven, eller vil omdisponere mellem bevillinger,
            fremsender de et aktstykke. Finansudvalget godkender eller afviser.
          </p>
          <p><strong>Sammenhæng med finansloven:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Finansloven</strong> fastsætter de årlige bevillinger (vedtages i december)</li>
            <li><strong>Aktstykker</strong> håndterer ændringer i løbet af året</li>
            <li><strong>Statsregnskabet</strong> viser det faktiske forbrug (offentliggøres året efter)</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'finanslov',
      title: 'Finanslov og Regnskab',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          <p><strong>Finanslovsdatabasen</strong> indeholder de vedtagne bevillinger fra finansloven:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>R (Regnskab)</strong> - Faktisk forbrug 2 år tilbage</li>
            <li><strong>B (Budget)</strong> - Bevillinger året før</li>
            <li><strong>F (Forslag)</strong> - Foreslåede bevillinger for finanslovsåret</li>
            <li><strong>BO1-BO3</strong> - Budgetoverslagsår 1-3 år frem</li>
          </ul>
          <p><strong>Regnskabsdatabasen</strong> viser det faktiske statsregnskab:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Bevilling</strong> - Den bevilgede ramme</li>
            <li><strong>Regnskab</strong> - Det faktiske forbrug</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hierarkiet: Paragraf (ministerium) → Hovedområde → Aktivitetsområde → Hovedkonto → Underkonto → Regnskabskonto
          </p>
        </div>
      ),
    },
    {
      id: 'styrelser',
      title: 'Styrelsesanalyse',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          <p>
            Sammenlign styrelser og institutioner på tværs af bevillinger og regnskaber.
          </p>
          <p><strong>Funktioner:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Vælg op til 6 styrelser at sammenligne</li>
            <li>Se udvikling over tid (tidsserie)</li>
            <li>Sammenlign standardkonti/regnskabskonti på tværs</li>
            <li>Skift mellem Finanslovs- og Regnskabsdata via tabs</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tip: Brug regnskabskonto-filteret til at sammenligne specifikke udgiftstyper (fx lønninger, IT, husleje) på tværs af styrelser.
          </p>
        </div>
      ),
    },
    {
      id: 'statistik',
      title: 'Statistik',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          <p>
            Overblik over parlamentarisk aktivitet i den valgte samling.
          </p>
          <p><strong>Grafer:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Sager per type</strong> - Fordeling af lovforslag, beslutningsforslag, spørgsmål etc.</li>
            <li><strong>Lovforslag per status</strong> - Hvor mange er vedtaget, forkastet, under behandling</li>
            <li><strong>Alm. del opdelt</strong> - Spørgsmål vs. samråd vs. andre henvendelser</li>
            <li><strong>Aktstykker per ministerium</strong> - Hvilke ministerier anmoder flest bevillinger</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'medlem',
      title: 'MF-opslag',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      content: (
        <div className="space-y-3">
          <p>
            Søg efter folketingsmedlemmer og se deres aktivitet.
          </p>
          <p><strong>Information:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Partihistorik og aktuelle tilhørsforhold</li>
            <li>Sager hvor MF'et er forslagsstiller</li>
            <li>Stillede spørgsmål og forespørgsler</li>
            <li>Ordførerskaber</li>
          </ul>
        </div>
      ),
    },
  ]

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Vejledning</h2>
        <p className="text-gray-500 dark:text-gray-400">Lær hvordan du bruger denne side til at udforske Folketingets data.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Link to="/soeg" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-ft-red dark:hover:border-ft-red transition-colors group">
          <div className="text-ft-red mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="font-medium text-gray-900 dark:text-white group-hover:text-ft-red transition-colors">Søg i sager</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Lovforslag, spørgsmål m.m.</div>
        </Link>
        <Link to="/aktstykker" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-ft-red dark:hover:border-ft-red transition-colors group">
          <div className="text-ft-red mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="font-medium text-gray-900 dark:text-white group-hover:text-ft-red transition-colors">Bevillinger</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Aktstykker til Finansudv.</div>
        </Link>
        <Link to="/finanslov" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-ft-red dark:hover:border-ft-red transition-colors group">
          <div className="text-ft-red mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="font-medium text-gray-900 dark:text-white group-hover:text-ft-red transition-colors">Finanslov</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Bevillinger og budgetter</div>
        </Link>
        <Link to="/styrelser" className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-ft-red dark:hover:border-ft-red transition-colors group">
          <div className="text-ft-red mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="font-medium text-gray-900 dark:text-white group-hover:text-ft-red transition-colors">Styrelser</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Sammenlign institutioner</div>
        </Link>
      </div>

      {/* Accordion sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="text-ft-red">{section.icon}</div>
                <span className="font-medium text-gray-900 dark:text-white">{section.title}</span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${openSection === section.id ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSection === section.id && (
              <div className="px-5 pb-5 text-gray-700 dark:text-gray-300 text-sm border-t border-gray-100 dark:border-gray-700 pt-4">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2">
          Har du spørgsmål eller feedback? Denne side er udviklet som et åbent projekt.
        </p>
        <p>
          Data opdateres løbende fra de officielle kilder. Seneste data fra Finansloven og Regnskabet afhænger af Økonomistyrelsens offentliggørelse.
        </p>
      </div>
    </div>
  )
}
