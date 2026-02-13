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

/** Find regnskabskonti under en node (rekursivt) - søger i hele træet */
function findRegnskabskonti(node: RegnskabNode, data: RegnskabData): RegnskabNode[] {
  const result: RegnskabNode[] = []

  // Byg prefix-mønster baseret på styrelsens kode (6-cifret hovedkonto)
  const agencyPrefix = node.code // fx "093106"

  // Find alle noder i data der er regnskabskonti
  for (const n of data.nodes) {
    // Tjek om det er en regnskabskonto (2-cifret) eller regnskabskonto_detalje (4-cifret)
    if (n.level === 'regnskabskonto' || n.level === 'regnskabskonto_detalje') {
      // Regnskabskonti har id format: ${year}-${underkontoCode}-${code}
      // Vi tjekker om underkontoen hører til denne styrelse
      const idParts = n.id.split('-')
      if (idParts.length >= 3) {
        // idParts[1] er underkontoCode (8-cifret)
        const underkontoCode = idParts[1]
        if (underkontoCode && underkontoCode.startsWith(agencyPrefix)) {
          result.push(n)
        }
      }
    }
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

/** Regnskabskonto kategorier (fra regnskabsinstruksen) - 2-cifrede hovedkoder */
export const REGNSKABSKONTO_CATEGORIES: Record<string, string> = {
  // Driftsindtægter (10-19)
  '11': 'Salg af varer',
  '12': 'Salg af tjenesteydelser',
  '13': 'Bidrag og tilskud',
  '14': 'Nettoindtægter ved drift',
  '15': 'Andre driftsindtægter',
  '16': 'Husleje, leje af arealer, leasing',
  '17': 'Internt statsligt køb af varer og tjenester',
  '18': 'Lønninger / personaleomkostninger',
  '19': 'Pensioner og pensionsbidrag',

  // Driftsomkostninger (20-29)
  '21': 'Forbrugsomkostninger',
  '22': 'Andre ordinære driftsomkostninger',
  '23': 'Afskrivninger',
  '24': 'Nedskrivninger',
  '25': 'Finansielle indtægter',
  '26': 'Finansielle omkostninger',
  '27': 'Ekstraordinære poster',
  '28': 'Skat',
  '29': 'Regulering primo',

  // Overførsler (30-49)
  '31': 'Overførselsindtægter fra staten',
  '32': 'Overførselsindtægter fra kommuner og regioner',
  '33': 'Overførselsindtægter fra EU',
  '34': 'Øvrige overførselsindtægter',
  '35': 'Overførselsudgifter til staten',
  '36': 'Overførselsudgifter til kommuner og regioner',
  '37': 'Driftstilskud og -overførsler',
  '38': 'Lovbundne tilskud',
  '39': 'Øvrige overførsler',
  '41': 'Overførselsudgifter til EU og øvrige udland',
  '42': 'Tilskud til husholdninger',
  '43': 'Tilskud til selvejende institutioner',
  '44': 'Tilskud til personer',
  '45': 'Tilskud til erhvervsvirksomhed',
  '46': 'Tilskud til anden virksomhed og investeringstilskud',
  '47': 'Andre tilskud og overførsler',
  '48': 'Øvrige tilskud',
  '49': 'Refusioner',

  // Anlægsaktiver (50-59)
  '51': 'Anlægsaktiver (anskaffelser)',
  '52': 'Anlægsaktiver (afskrivninger)',
  '53': 'Anlægsaktiver (nedskrivninger)',
  '54': 'Anlægsaktiver (afhændelse)',
  '55': 'Anlægsaktiver (tilgang)',
  '56': 'Anlægsaktiver (afgang)',
  '57': 'Finansielle anlægsaktiver',
  '58': 'Materielle anlægsaktiver',
  '59': 'Immaterielle anlægsaktiver',

  // Udlån og tilgodehavender (60-69)
  '61': 'Udlån',
  '62': 'Tilgodehavender',
  '63': 'Værdipapirer',
  '64': 'Andre finansielle aktiver',
  '65': 'Indeståender',

  // Gæld og hensættelser (70-79)
  '71': 'Lån',
  '72': 'Leverandører og andre kreditorer',
  '73': 'Hensættelser',
  '74': 'Periodeafgrænsningsposter',
  '75': 'Anden gæld',

  // Egenkapital (80-89)
  '81': 'Egenkapital',
  '82': 'Statsforskrivning',
  '83': 'Reserver',
  '84': 'Overført overskud',

  // Diverse (90-99)
  '91': 'Bevillingskonti',
  '92': 'Afregningskonti',
  '93': 'Mellemregninger',
  '94': 'Diverse konti',
  '95': 'Omkonteringer',
}
