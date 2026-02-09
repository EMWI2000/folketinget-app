import type { BudgetNode, FinanslovData } from './types'

/** Mønstre der identificerer styrelser */
const AGENCY_PATTERNS = [
  /styrelsen$/i,
  /direktoratet$/i,
  /tilsynet$/i,
  /nævnet$/i,
  /rådet$/i,
  /centret$/i,
  /center$/i,
  /instituttet$/i,
  /institut$/i,
  /tjenesten$/i,
  /kontoret$/i,
  /agenturet$/i,
  /fonden$/i,
  /museet$/i,
  /kommissionen$/i,
]

/** Mønstre der IKKE er styrelser (ministerier, departementer) */
const EXCLUDE_PATTERNS = [
  /ministeriet$/i,
  /ministerium$/i,
  /departementet$/i,
  /i alt$/i,
]

/** Tjek om en node er en styrelse */
export function isAgency(node: BudgetNode): boolean {
  const name = node.name.trim()

  // Ekskluder ministerier mm.
  if (EXCLUDE_PATTERNS.some((p) => p.test(name))) {
    return false
  }

  // Tjek om det matcher et styrelse-mønster
  return AGENCY_PATTERNS.some((p) => p.test(name))
}

/** Find alle styrelser i finanslovsdata */
export function findAgencies(data: FinanslovData): BudgetNode[] {
  return data.nodes.filter(isAgency)
}

/** Find styrelser med deres standardkonti */
export interface AgencyWithAccounts {
  agency: BudgetNode
  standardkonti: BudgetNode[]
  ministry: BudgetNode | null
}

export function findAgenciesWithAccounts(data: FinanslovData): AgencyWithAccounts[] {
  const agencies = findAgencies(data)

  return agencies.map((agency) => {
    // Find standardkonti under denne node
    const standardkonti = findStandardkonti(agency, data)

    // Find ministerium (paragraf-niveau)
    let ministry: BudgetNode | null = null
    if (agency.parentCode) {
      let current: BudgetNode | undefined = data.index[agency.parentCode]
      while (current) {
        if (current.level === 'paragraf') {
          ministry = current
          break
        }
        current = current.parentCode ? data.index[current.parentCode] : undefined
      }
    }

    return {
      agency,
      standardkonti,
      ministry,
    }
  })
}

/** Find standardkonti under en node (rekursivt) */
function findStandardkonti(node: BudgetNode, _data: FinanslovData): BudgetNode[] {
  const result: BudgetNode[] = []

  function traverse(n: BudgetNode) {
    if (n.level === 'standardkonto') {
      result.push(n)
    }
    for (const child of n.children) {
      traverse(child)
    }
  }

  // Start fra nodens børn
  for (const child of node.children) {
    traverse(child)
  }

  return result
}

/** Aggreger standardkonti for en styrelse */
export interface StandardkontoAggregate {
  code: string
  name: string
  total: number
}

export function aggregateStandardkonti(standardkonti: BudgetNode[], valueKey: 'R' | 'F' | 'B'): StandardkontoAggregate[] {
  const byCode = new Map<string, { name: string; total: number }>()

  for (const konto of standardkonti) {
    const existing = byCode.get(konto.code)
    if (existing) {
      existing.total += konto.values[valueKey]
    } else {
      byCode.set(konto.code, {
        name: konto.name,
        total: konto.values[valueKey],
      })
    }
  }

  return Array.from(byCode.entries())
    .map(([code, { name, total }]) => ({ code, name, total }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
}

/** Standardkonto kategorier (typisk struktur) */
export const STANDARDKONTO_CATEGORIES: Record<string, string> = {
  '01': 'Lønninger',
  '02': 'Pensioner',
  '06': 'Køb af varer og tjenesteydelser',
  '07': 'Køb af fast ejendom',
  '10': 'Tilskud',
  '11': 'Tilskud (EU)',
  '12': 'Tilskud (andre)',
  '18': 'Overførsler til personer',
  '19': 'Overførsler til personer',
  '22': 'Renteudgifter',
  '35': 'Indtægter',
  '45': 'Skatter',
  '52': 'Indtægter fra salg',
  '54': 'Renteindtægter',
}
