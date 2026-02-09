/** Regnskabsværdier - to kolonner per fil (to forskellige regnskabsår) */
export interface RegnskabValues {
  year1: number // Første kolonne (typisk regnskab for foregående år)
  year2: number // Anden kolonne (typisk regnskab for året før)
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
  year: number // Filens år (fx 2024)
  year1Label: number // Første kolonne dækker dette år (fx 2022)
  year2Label: number // Anden kolonne dækker dette år (fx 2023)
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
