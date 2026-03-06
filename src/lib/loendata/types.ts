export interface LoenRaekke {
  personalekategori: string
  stilling: string
  loentrin: string
  aarsvaerk: number
  basislon: number
  plustid: number
  pension: number
  fasteMidlCentrale: number
  fasteLokale: number
  midlertLokale: number
  engangsvederlag: number
  andreTillaeg: number
  samletLon: number
  periode: string
  ministeromraade: string
  hovedkonto: string
  type: 'Departement' | 'Styrelse' | 'Andet'
}

export interface LoenFilter {
  perioder: string[]
  ministeromraader: string[]
  hovedkonti: string[]
  typer: ('Departement' | 'Styrelse' | 'Andet')[]
  personalekategorier: string[]
  stillinger: string[]
  loentrin: string[]
}

export interface BenchmarkRaekke {
  navn: string // hovedkonto eller gruppenavn
  aarsvaerk: number // sum
  samletLon: number // vægtet gennemsnit
  basislon: number
  plustid: number
  pension: number
  fasteMidlCentrale: number
  fasteLokale: number
  midlertLokale: number
  engangsvederlag: number
  andreTillaeg: number
  type: string
  ministeromraade: string
  periode?: string
}

export const LOEN_KOMPONENTER = [
  { key: 'basislon' as const, label: 'Basisløn', color: '#2563eb' },
  { key: 'pension' as const, label: 'Pension', color: '#059669' },
  { key: 'fasteMidlCentrale' as const, label: 'Faste/midl. tillæg (Centrale)', color: '#d97706' },
  { key: 'fasteLokale' as const, label: 'Faste tillæg (Lokale)', color: '#7c3aed' },
  { key: 'midlertLokale' as const, label: 'Midlert. tillæg (Lokale)', color: '#db2777' },
  { key: 'engangsvederlag' as const, label: 'Engangsvederlag', color: '#0891b2' },
  { key: 'plustid' as const, label: 'Plustid', color: '#65a30d' },
  { key: 'andreTillaeg' as const, label: 'Andre tillæg', color: '#9333ea' },
] as const

export type LoenKomponentKey = (typeof LOEN_KOMPONENTER)[number]['key']

export const COMPARE_COLORS = [
  '#a1172f', // ft-red
  '#2563eb', // blue-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
  '#65a30d', // lime-600
]
