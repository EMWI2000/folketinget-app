export interface LoenRaekke {
  personalekategori?: string
  stilling?: string
  loentrin?: string
  klasse?: string
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
  type: string
}

export type TabelfordelingId =
  | 'pkat'
  | 'pkat_klasse'
  | 'pkat_klasse_loentrin'
  | 'pkat_loentrin'
  | 'pkat_stilling'
  | 'pkat_stilling_loentrin'
  | 'stilling'

export interface TabelfordelingInfo {
  id: TabelfordelingId
  label: string
  file: string
  dimensioner: (keyof Pick<LoenRaekke, 'personalekategori' | 'stilling' | 'loentrin' | 'klasse'>)[]
}

export const TABELFORDELINGER: TabelfordelingInfo[] = [
  { id: 'pkat', label: 'Personalekategori', file: 'pkat.csv', dimensioner: ['personalekategori'] },
  { id: 'pkat_klasse', label: 'Personalekategori og klasse', file: 'pkat_klasse.csv', dimensioner: ['personalekategori', 'klasse'] },
  { id: 'pkat_klasse_loentrin', label: 'Personalekategori, klasse og løntrin', file: 'pkat_klasse_loentrin.csv', dimensioner: ['personalekategori', 'klasse', 'loentrin'] },
  { id: 'pkat_loentrin', label: 'Personalekategori og løntrin', file: 'pkat_loentrin.csv', dimensioner: ['personalekategori', 'loentrin'] },
  { id: 'pkat_stilling', label: 'Personalekategori og stillingsbetegnelse', file: 'pkat_stilling.csv', dimensioner: ['personalekategori', 'stilling'] },
  { id: 'pkat_stilling_loentrin', label: 'Personalekategori, stillingsbetegn. og løntrin', file: 'pkat_stilling_loentrin.csv', dimensioner: ['personalekategori', 'stilling', 'loentrin'] },
  { id: 'stilling', label: 'Stillingsbetegnelse', file: 'stilling.csv', dimensioner: ['stilling'] },
]

export interface LoenFilter {
  perioder: string[]
  ministeromraader: string[]
  hovedkonti: string[]
  typer: string[]
  personalekategorier: string[]
  stillinger: string[]
  loentrin: string[]
  klasser: string[]
}

export interface BenchmarkRaekke {
  navn: string
  aarsvaerk: number
  samletLon: number
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
