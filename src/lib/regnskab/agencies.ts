import type { RegnskabNode, RegnskabData } from './types'

/** Mønstre der identificerer styrelser */
const AGENCY_PATTERNS = [
  /styrelsen$/i,
  /direktoratet$/i,
  /nævnet$/i,
]

/** Mønstre der IKKE er styrelser (ministerier, departementer) */
const EXCLUDE_PATTERNS = [
  /ministeriet$/i,
  /ministerium$/i,
  /departementet$/i,
  /i alt$/i,
]

/** Tjek om en node er en styrelse (kun på hovedkonto-niveau) */
export function isAgency(node: RegnskabNode): boolean {
  // Styrelser ligger KUN på hovedkonto-niveau (6-cifret kode)
  if (node.level !== 'hovedkonto') {
    return false
  }

  const name = node.name.trim()

  // Ekskluder ministerier mm.
  if (EXCLUDE_PATTERNS.some((p) => p.test(name))) {
    return false
  }

  // Tjek om det matcher et styrelse-mønster
  return AGENCY_PATTERNS.some((p) => p.test(name))
}

/** Find alle styrelser i regnskabsdata (kun hovedkonti) */
export function findAgencies(data: RegnskabData): RegnskabNode[] {
  return data.nodes.filter(isAgency)
}

/** Find styrelser med deres regnskabskonti */
export interface AgencyWithAccounts {
  agency: RegnskabNode
  regnskabskonti: RegnskabNode[]
  ministry: RegnskabNode | null
}

export function findAgenciesWithAccounts(data: RegnskabData): AgencyWithAccounts[] {
  const agencies = findAgencies(data)

  return agencies.map((agency) => {
    // Find regnskabskonti under denne node
    const regnskabskonti = findRegnskabskonti(agency, data)

    // Find ministerium (paragraf-niveau)
    let ministry: RegnskabNode | null = null
    if (agency.parentCode) {
      let current: RegnskabNode | undefined = data.index[agency.parentCode]
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
      regnskabskonti,
      ministry,
    }
  })
}

/** Find regnskabskonti under en node (rekursivt) */
function findRegnskabskonti(node: RegnskabNode, _data: RegnskabData): RegnskabNode[] {
  const result: RegnskabNode[] = []

  function traverse(n: RegnskabNode) {
    if (n.level === 'regnskabskonto' || n.level === 'regnskabskonto_detalje') {
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

/** Aggreger regnskabskonti for en styrelse */
export interface RegnskabskontoAggregate {
  code: string
  name: string
  totalYear1: number
  totalYear2: number
}

export function aggregateRegnskabskonti(
  regnskabskonti: RegnskabNode[]
): RegnskabskontoAggregate[] {
  const byCode = new Map<string, { name: string; totalYear1: number; totalYear2: number }>()

  for (const konto of regnskabskonti) {
    const existing = byCode.get(konto.code)
    if (existing) {
      existing.totalYear1 += konto.values.year1
      existing.totalYear2 += konto.values.year2
    } else {
      byCode.set(konto.code, {
        name: konto.name,
        totalYear1: konto.values.year1,
        totalYear2: konto.values.year2,
      })
    }
  }

  return Array.from(byCode.entries())
    .map(([code, { name, totalYear1, totalYear2 }]) => ({ code, name, totalYear1, totalYear2 }))
    .sort((a, b) => Math.abs(b.totalYear1 + b.totalYear2) - Math.abs(a.totalYear1 + a.totalYear2))
}

/** Regnskabskonto kategorier (typisk struktur fra regnskabsinstruksen) */
export const REGNSKABSKONTO_CATEGORIES: Record<string, string> = {
  '11': 'Salg af varer',
  '16': 'Husleje, leje af arealer, leasing',
  '18': 'Lønninger / personaleomkostninger',
  '22': 'Andre ordinære driftsomkostninger',
  '25': 'Finansielle indtægter',
  '26': 'Finansielle omkostninger',
  '34': 'Øvrige overførselsindtægter',
  '41': 'Overførselsudgifter til EU og øvrige udland',
  '44': 'Tilskud til personer',
  '46': 'Tilskud til anden virksomhed og investeringstilskud',
  '51': 'Anlægsaktiver (anskaffelser)',
  '52': 'Anlægsaktiver (afskrivninger)',
  '53': 'Anlægsaktiver (nedskrivninger)',
  '54': 'Anlægsaktiver (afhændelse)',
}
