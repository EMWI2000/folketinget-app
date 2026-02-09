/** Regnskabsværdier - to kolonner per fil (bevilling og faktisk regnskab for samme år) */
export interface RegnskabValues {
  year1: number // Første kolonne: Bevilling
  year2: number // Anden kolonne: Faktisk regnskab
}

export type HierarchyLevel =
  | 'paragraf'           // 2-cifret (01, 02, 03, ...)
  | 'hovedomraade'       // 3-cifret (011, 021, ...)
  | 'aktivitetsomraade'  // 4-cifret (0111, 0211, ...)
  | 'hovedkonto'         // 6-cifret (011101, ...)
  | 'underkonto'         // 8-cifret (01110110, ...)
  | 'regnskabskonto'     // 2-cifret under underkonto (11, 18, 22, ...)
  | 'regnskabskonto_detalje' // 4-cifret regnskabskonto (1100, 1811, 2200, ...)

export interface RegnskabNode {
  id: string
  code: string
  name: string
  level: HierarchyLevel
  values: RegnskabValues
  year: number // Hvilket regnskabsår filen dækker (filens år)
  children: RegnskabNode[]
  parentCode: string | null
}

export interface RegnskabData {
  year: number // Filens år (fx 2024) - data gælder for dette år
  year1Label: string // Label for første kolonne (fx "Bevilling")
  year2Label: string // Label for anden kolonne (fx "Regnskab")
  tree: RegnskabNode[]
  nodes: RegnskabNode[]
  index: Record<string, RegnskabNode>
}

/** Farver til sammenligning */
export const COMPARE_COLORS = [
  '#a1172f', // ft-red
  '#2563eb', // blue-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
]

export interface CompareItem {
  node: RegnskabNode
  color: string
}

/** Niveau-labels til UI */
export const LEVEL_LABELS: Record<HierarchyLevel, string> = {
  paragraf: 'Paragraf (ministerium)',
  hovedomraade: 'Hovedområde',
  aktivitetsomraade: 'Aktivitetsområde',
  hovedkonto: 'Hovedkonto',
  underkonto: 'Underkonto',
  regnskabskonto: 'Regnskabskonto',
  regnskabskonto_detalje: 'Regnskabskonto (detalje)',
}
