import type { LoenRaekke, LoenFilter, BenchmarkRaekke } from './types'

/**
 * Parse en CSV-linje med korrekt håndtering af quoted fields.
 * Felter der indeholder komma er omgivet af dobbelte anførselstegn.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

/** Normalisér header-navn (fjern BOM, lowercase, trim) */
function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, '').trim().toLowerCase()
}

/** Header-til-felt mapping */
const HEADER_MAP: Record<string, keyof LoenRaekke> = {
  'personalekategori': 'personalekategori',
  'stilling': 'stilling',
  'løntrin': 'loentrin',
  'klasse/lønramme': 'klasse',
  'årsværk': 'aarsvaerk',
  'basisløn': 'basislon',
  'plustid': 'plustid',
  'pension': 'pension',
  'faste/midl. tillæg (centrale)': 'fasteMidlCentrale',
  'faste tillæg (lokale)': 'fasteLokale',
  'midlert. tillæg (lokale)': 'midlertLokale',
  'engangs-vederlag': 'engangsvederlag',
  'andre tillæg': 'andreTillaeg',
  'samlet løn': 'samletLon',
  'periode': 'periode',
  'ministerområde': 'ministeromraade',
  'hovedkonto': 'hovedkonto',
  'type': 'type',
}

const NUMERIC_FIELDS = new Set<keyof LoenRaekke>([
  'aarsvaerk', 'basislon', 'plustid', 'pension',
  'fasteMidlCentrale', 'fasteLokale', 'midlertLokale',
  'engangsvederlag', 'andreTillaeg', 'samletLon',
])

/** Parse hele CSV-filen til LoenRaekke[] — header-baseret (håndterer alle tabelfordelinger) */
export function parseLoenCSV(content: string): LoenRaekke[] {
  const lines = content.split(/\r?\n/)
  if (lines.length < 2) return []

  // Parse header
  const headerFields = parseCSVLine(lines[0])
  const colMap: { index: number; field: keyof LoenRaekke }[] = []

  for (let i = 0; i < headerFields.length; i++) {
    const normalized = normalizeHeader(headerFields[i])
    const field = HEADER_MAP[normalized]
    if (field) {
      colMap.push({ index: i, field })
    }
  }

  const rows: LoenRaekke[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCSVLine(line)

    const row: Partial<LoenRaekke> = {}
    for (const { index, field } of colMap) {
      const val = fields[index] ?? ''
      if (NUMERIC_FIELDS.has(field)) {
        ;(row as Record<string, unknown>)[field] = parseFloat(val) || 0
      } else {
        ;(row as Record<string, unknown>)[field] = val
      }
    }

    // Skip rækker uden årsværk
    if (!row.aarsvaerk || row.aarsvaerk <= 0) continue
    // Kræv de faste felter
    if (!row.periode || !row.hovedkonto || !row.ministeromraade) continue

    rows.push(row as LoenRaekke)
  }

  return rows
}

/** Anvend alle filtre på datasættet */
export function filtrerData(data: LoenRaekke[], filter: LoenFilter): LoenRaekke[] {
  return data.filter((r) => {
    if (filter.perioder.length > 0 && !filter.perioder.includes(r.periode)) return false
    if (filter.ministeromraader.length > 0 && !filter.ministeromraader.includes(r.ministeromraade)) return false
    if (filter.hovedkonti.length > 0 && !filter.hovedkonti.includes(r.hovedkonto)) return false
    if (filter.typer.length > 0 && !filter.typer.includes(r.type)) return false
    if (filter.personalekategorier.length > 0 && r.personalekategori && !filter.personalekategorier.includes(r.personalekategori)) return false
    if (filter.stillinger.length > 0 && r.stilling && !filter.stillinger.includes(r.stilling)) return false
    if (filter.loentrin.length > 0 && r.loentrin && !filter.loentrin.includes(r.loentrin)) return false
    if (filter.klasser.length > 0 && r.klasse && !filter.klasser.includes(r.klasse)) return false
    return true
  })
}

/**
 * Beregn benchmark (vægtet gennemsnit) grupperet efter hovedkonto.
 *
 * VIGTIGT: Løntal er gennemsnit pr. årsværk og kan IKKE summeres direkte.
 * Ved aggregering: vægtet_gns = Σ(løn_i × årsværk_i) / Σ(årsværk_i)
 * Årsværk kan summeres direkte.
 */
export function beregnBenchmark(data: LoenRaekke[]): BenchmarkRaekke[] {
  // Gruppér efter hovedkonto
  const grupper = new Map<string, LoenRaekke[]>()
  for (const r of data) {
    const key = r.hovedkonto
    if (!grupper.has(key)) grupper.set(key, [])
    grupper.get(key)!.push(r)
  }

  const result: BenchmarkRaekke[] = []
  for (const [hovedkonto, raekker] of grupper) {
    const sumAarsvaerk = raekker.reduce((s, r) => s + r.aarsvaerk, 0)
    if (sumAarsvaerk === 0) continue

    result.push({
      navn: hovedkonto,
      aarsvaerk: sumAarsvaerk,
      samletLon: vaegtetGns(raekker, 'samletLon'),
      basislon: vaegtetGns(raekker, 'basislon'),
      plustid: vaegtetGns(raekker, 'plustid'),
      pension: vaegtetGns(raekker, 'pension'),
      fasteMidlCentrale: vaegtetGns(raekker, 'fasteMidlCentrale'),
      fasteLokale: vaegtetGns(raekker, 'fasteLokale'),
      midlertLokale: vaegtetGns(raekker, 'midlertLokale'),
      engangsvederlag: vaegtetGns(raekker, 'engangsvederlag'),
      andreTillaeg: vaegtetGns(raekker, 'andreTillaeg'),
      type: raekker[0].type,
      ministeromraade: raekker[0].ministeromraade,
    })
  }

  return result.sort((a, b) => b.aarsvaerk - a.aarsvaerk)
}

/**
 * Beregn benchmark grupperet efter hovedkonto OG periode (til tidsserier).
 */
export function beregnBenchmarkPerPeriode(data: LoenRaekke[]): BenchmarkRaekke[] {
  const grupper = new Map<string, LoenRaekke[]>()
  for (const r of data) {
    const key = `${r.hovedkonto}||${r.periode}`
    if (!grupper.has(key)) grupper.set(key, [])
    grupper.get(key)!.push(r)
  }

  const result: BenchmarkRaekke[] = []
  for (const [, raekker] of grupper) {
    const sumAarsvaerk = raekker.reduce((s, r) => s + r.aarsvaerk, 0)
    if (sumAarsvaerk === 0) continue

    result.push({
      navn: raekker[0].hovedkonto,
      aarsvaerk: sumAarsvaerk,
      samletLon: vaegtetGns(raekker, 'samletLon'),
      basislon: vaegtetGns(raekker, 'basislon'),
      plustid: vaegtetGns(raekker, 'plustid'),
      pension: vaegtetGns(raekker, 'pension'),
      fasteMidlCentrale: vaegtetGns(raekker, 'fasteMidlCentrale'),
      fasteLokale: vaegtetGns(raekker, 'fasteLokale'),
      midlertLokale: vaegtetGns(raekker, 'midlertLokale'),
      engangsvederlag: vaegtetGns(raekker, 'engangsvederlag'),
      andreTillaeg: vaegtetGns(raekker, 'andreTillaeg'),
      type: raekker[0].type,
      ministeromraade: raekker[0].ministeromraade,
      periode: raekker[0].periode,
    })
  }

  return result
}

/** Beregn vægtet gennemsnit for en given lønkomponent */
function vaegtetGns(raekker: LoenRaekke[], felt: keyof LoenRaekke): number {
  const sumAarsvaerk = raekker.reduce((s, r) => s + r.aarsvaerk, 0)
  if (sumAarsvaerk === 0) return 0
  const sumVaegtet = raekker.reduce((s, r) => s + (r[felt] as number) * r.aarsvaerk, 0)
  return Math.round(sumVaegtet / sumAarsvaerk)
}

/** Hent sorterede unikke værdier for en given kolonne.
 *  Bruger numerisk-bevidst sortering, så nummer-præfikser uden nul-padding
 *  (fx personalekategori "6"/"46"/"240", løntrin) sorterer naturligt. */
export function hentUnikke(data: LoenRaekke[], felt: keyof LoenRaekke): string[] {
  const set = new Set<string>()
  for (const r of data) {
    const val = r[felt]
    if (val != null && val !== '') set.add(String(val))
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'da', { numeric: true }))
}

/** Hent hovedkonti filtreret efter valgte ministerområder */
export function hentHovedkontiForMinisteromraader(
  data: LoenRaekke[],
  ministeromraader: string[]
): string[] {
  if (ministeromraader.length === 0) return hentUnikke(data, 'hovedkonto')
  const set = new Set<string>()
  for (const r of data) {
    if (ministeromraader.includes(r.ministeromraade)) {
      set.add(r.hovedkonto)
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'da', { numeric: true }))
}

/** Formatér løn i danske kroner */
export function formatLoen(value: number): string {
  return new Intl.NumberFormat('da-DK', {
    maximumFractionDigits: 0,
  }).format(value)
}

/** Formatér årsværk med én decimal */
export function formatAarsvaerk(value: number): string {
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Omregn en periode til et fortløbende kvartals-index (år × 4 + kvartal − 1).
 * Bruges til tidsbaseret x-akse, så manglende kvartaler (fx hele 2025 i de
 * fleste tabelfordelinger) får korrekt afstand i stedet for at blive trukket
 * sammen. Returnerer null hvis formatet ikke kan genkendes.
 */
export function periodeTilIndex(periode: string): number | null {
  const m = periode.match(/(\d{4}),\s*(\d)/)
  if (!m) return null
  return parseInt(m[1]) * 4 + (parseInt(m[2]) - 1)
}

/** Omregn et kvartals-index tilbage til en kort label, fx "Q3 2025". */
export function indexTilKvartal(idx: number): string {
  const aar = Math.floor(idx / 4)
  const kvt = (idx % 4) + 1
  return `Q${kvt} ${aar}`
}

/** Sortér perioder kronologisk (f.eks. "2025, 1. kvt." < "2025, 2. kvt.") */
export function sorterPerioder(perioder: string[]): string[] {
  return [...perioder].sort(
    (a, b) => (periodeTilIndex(a) ?? 0) - (periodeTilIndex(b) ?? 0)
  )
}

/** Opret tom filter */
export function tomFilter(): LoenFilter {
  return {
    perioder: [],
    ministeromraader: [],
    hovedkonti: [],
    typer: [],
    personalekategorier: [],
    stillinger: [],
    loentrin: [],
    klasser: [],
  }
}
