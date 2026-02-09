/** Budgetværdier fra finansloven (alle i mio. kr.) */
export interface BudgetValues {
  R: number       // Regnskab (faktisk forbrug Y-2)
  B: number       // Budget fra forrige finanslov
  F: number       // Finanslovbevilling (aktuelt budget)
  BO1: number     // Budgetoverslag Y+1
  BO2: number     // Budgetoverslag Y+2
  BO3: number     // Budgetoverslag Y+3
}

/** Hierarkiniveauer i kontoplanen */
export type HierarchyLevel =
  | 'paragraf'          // 2-cifret (ministerium)
  | 'hovedomraade'      // 3-cifret
  | 'aktivitetsomraade' // 4-cifret
  | 'hovedkonto'        // 6-cifret
  | 'underkonto'        // 8-cifret
  | 'standardkonto'     // 2-cifret (udgiftstype, barn af underkonto)

/** En node i budgethierarkiet */
export interface BudgetNode {
  id: string              // Unik ID: `${year}-${code}`
  code: string            // Kontokode (f.eks. "07", "071", "071101")
  name: string            // Kontonavn
  level: HierarchyLevel
  values: BudgetValues
  year: number
  children: BudgetNode[]
  parentCode: string | null
}

/** Parseret finanslovsdata for et enkelt år */
export interface FinanslovData {
  year: number
  tree: BudgetNode[]              // Hierarkisk træ (rodnoder = paragraffer)
  nodes: BudgetNode[]             // Flad liste af alle noder
  index: Record<string, BudgetNode>  // Hurtig opslag: code → node
}

/** Element valgt til sammenligning */
export interface CompareItem {
  node: BudgetNode
  color: string
}

/** Drag-and-drop context */
export interface DragState {
  isDragging: boolean
  draggedNode: BudgetNode | null
}

/** Niveau-labels til UI */
export const LEVEL_LABELS: Record<HierarchyLevel, string> = {
  paragraf: 'Paragraf (ministerium)',
  hovedomraade: 'Hovedområde',
  aktivitetsomraade: 'Aktivitetsområde',
  hovedkonto: 'Hovedkonto',
  underkonto: 'Underkonto',
  standardkonto: 'Standardkonto',
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
