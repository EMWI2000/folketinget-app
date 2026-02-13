import type { RegnskabNode, HierarchyLevel, RegnskabData, RegnskabValues } from './types'
import { parseDanishNumber } from './formatter'

interface ParsedLine {
  code: string
  name: string
  values: RegnskabValues
  codeLength: number
}

/** Parse en enkelt linje fra CSV */
function parseLine(line: string): ParsedLine | null {
  if (!line.trim()) return null

  const parts = line.split(';')
  if (parts.length < 3) return null

  // Første kolonne: "07 Finansministeriet " (med quotes og trailing space)
  let label = parts[0].trim()
  if (label.startsWith('"')) label = label.slice(1)
  if (label.endsWith('"')) label = label.slice(0, -1)
  label = label.trim()

  // Split kode fra navn: "07 Finansministeriet" → ["07", "Finansministeriet"]
  const match = label.match(/^(\d+)\s+(.*)$/)
  if (!match) return null

  const code = match[1]
  const name = match[2].trim()

  // Skip linjer med stjerner (aggregerede/fejl-linjer)
  if (code.includes('*')) return null

  // Parse de 2 værdikolonner (year1 og year2)
  const values: RegnskabValues = {
    year1: parseDanishNumber(parts[1]),
    year2: parseDanishNumber(parts[2]),
  }

  return {
    code,
    name,
    values,
    codeLength: code.length,
  }
}

/**
 * Bestem hierarkiniveau baseret på kodelængde og kontekst.
 *
 * Regnskabsdatabasen har en speciel struktur:
 * - 2-cifret: paragraf (ministerium) ELLER regnskabskonto under underkonto
 * - 3-cifret: hovedområde
 * - 4-cifret: aktivitetsområde ELLER regnskabskonto_detalje
 * - 6-cifret: hovedkonto
 * - 8-cifret: underkonto
 *
 * VIGTIGT:
 * - Aktivitetsområder starter med "0" (fx "0111", "0211"),
 *   mens regnskabskonti starter med "1-9" (fx "1100", "2200", "4400").
 * - Paragraffer kan starte med ethvert ciffer (fx "07", "25", "38"),
 *   men regnskabskonti forekommer KUN efter en underkonto.
 */
function determineLevel(
  code: string,
  codeLength: number,
  _nextCode: string | null, // Beholdt for eventuel fremtidig brug
  lastUnderkontoCode: string | null
): HierarchyLevel {
  const firstDigit = code[0]
  const startsWithZero = firstDigit === '0'

  // 8-cifret er altid underkonto
  if (codeLength === 8) {
    return 'underkonto'
  }

  // 6-cifret er altid hovedkonto (starter altid med 0)
  if (codeLength === 6) {
    return 'hovedkonto'
  }

  // 4-cifret: aktivitetsområde (starter med 0) vs regnskabskonto_detalje (starter med 1-9)
  if (codeLength === 4) {
    if (startsWithZero) {
      return 'aktivitetsomraade'
    }
    // Regnskabskonto detalje (fx "1100", "2200") - kun hvis vi er efter en underkonto
    if (lastUnderkontoCode) {
      return 'regnskabskonto_detalje'
    }
    // Fallback - sjældent, men håndter det
    return 'aktivitetsomraade'
  }

  // 3-cifret: hovedområde (starter altid med 0)
  if (codeLength === 3) {
    return 'hovedomraade'
  }

  // 2-cifret: paragraf vs regnskabskonto
  // Regnskabskonti forekommer KUN efter en underkonto (8-cifret)
  // Paragraffer kan starte med ethvert ciffer (fx "07", "25", "38")
  if (codeLength === 2) {
    // Hvis vi er efter en underkonto, er det en regnskabskonto
    if (lastUnderkontoCode) {
      return 'regnskabskonto'
    }
    // Ellers er det en paragraf (ministerium)
    return 'paragraf'
  }

  return 'regnskabskonto'
}

/** Find parent-kode baseret på niveau */
function findParentCode(
  code: string,
  level: HierarchyLevel,
  lastUnderkontoCode: string | null,
  lastRegnskabskontoCode: string | null
): string | null {
  switch (level) {
    case 'paragraf':
      return null // Top-niveau
    case 'hovedomraade':
      return code.slice(0, 2) // 071 → 07
    case 'aktivitetsomraade':
      return code.slice(0, 3) // 0711 → 071
    case 'hovedkonto':
      return code.slice(0, 4) // 071101 → 0711
    case 'underkonto':
      return code.slice(0, 6) // 07110110 → 071101
    case 'regnskabskonto':
      return lastUnderkontoCode // Barn af seneste 8-cifrede underkonto
    case 'regnskabskonto_detalje':
      // Barn af seneste 2-cifrede regnskabskonto - brug index-nøgle format
      return lastRegnskabskontoCode // Format: "${underkontoCode}-${regnskabskontoCode}"
    default:
      return null
  }
}

/** Parse CSV-indhold til flad liste af noder */
function parseCSVContent(content: string): ParsedLine[] {
  const lines = content.split(/\r?\n/)
  const parsed: ParsedLine[] = []

  for (const line of lines) {
    const result = parseLine(line)
    if (result) {
      parsed.push(result)
    }
  }

  return parsed
}

/** Byg hierarkisk træ fra flad liste */
function buildTree(parsedLines: ParsedLine[], year: number): RegnskabData {
  const nodes: RegnskabNode[] = []
  const index: Record<string, RegnskabNode> = {}
  const tree: RegnskabNode[] = []

  // Track seneste underkontoer og regnskabskonti
  let lastUnderkontoCode: string | null = null
  let lastRegnskabskontoCode: string | null = null

  for (let i = 0; i < parsedLines.length; i++) {
    const line = parsedLines[i]
    const nextLine = parsedLines[i + 1]

    const level = determineLevel(
      line.code,
      line.codeLength,
      nextLine?.code ?? null,
      lastUnderkontoCode
    )

    // Beregn parentCode FØR vi opdaterer tracking
    // (så regnskabskonto_detalje kan finde sin parent regnskabskonto)
    const parentCode = findParentCode(line.code, level, lastUnderkontoCode, lastRegnskabskontoCode)

    // Opdater tracking baseret på niveau EFTER parentCode er beregnet
    if (level === 'underkonto') {
      lastUnderkontoCode = line.code
      lastRegnskabskontoCode = null // Reset regnskabskonto når vi starter ny underkonto
    } else if (level === 'regnskabskonto') {
      lastRegnskabskontoCode = `${lastUnderkontoCode}-${line.code}`
    } else if (level === 'paragraf' || level === 'hovedomraade' || level === 'aktivitetsomraade' || level === 'hovedkonto') {
      // Reset underkonto tracking når vi går til et kontohieraki-niveau
      // (paragraf, hovedområde, aktivitetsområde, hovedkonto)
      lastUnderkontoCode = null
      lastRegnskabskontoCode = null
    }
    // Note: regnskabskonto_detalje nulstiller IKKE lastUnderkontoCode eller lastRegnskabskontoCode

    // Generér unikt ID - regnskabskonti får underkonto-prefix for at være unikke
    const uniqueId = level === 'regnskabskonto' || level === 'regnskabskonto_detalje'
      ? `${year}-${lastUnderkontoCode}-${line.code}`
      : `${year}-${line.code}`

    const node: RegnskabNode = {
      id: uniqueId,
      code: line.code,
      name: line.name,
      level,
      values: line.values,
      year,
      children: [],
      parentCode,
    }

    nodes.push(node)

    // Gem i index med unikt nøgle
    const indexKey = level === 'regnskabskonto' || level === 'regnskabskonto_detalje'
      ? `${lastUnderkontoCode}-${line.code}`
      : line.code
    index[indexKey] = node

    // Tilføj til parent's children eller til root
    if (parentCode && index[parentCode]) {
      index[parentCode].children.push(node)
    } else if (level === 'paragraf') {
      tree.push(node)
    }
  }

  // Regnskabsdatabasen: Bevilling og faktisk regnskab for filens år
  // Fx 2024.csv indeholder bevilling og regnskab for 2024
  return {
    year,
    year1Label: 'Bevilling',
    year2Label: 'Regnskab',
    tree,
    nodes,
    index
  }
}

/** Alle mulige regnskabsår - opdater denne liste når nye filer tilføjes */
const ALL_POSSIBLE_YEARS = [2020, 2021, 2022, 2023, 2024, 2025]

/** Hent og parse regnskabs-CSV for et givet år - returnerer null hvis filen ikke findes */
export async function parseRegnskabCSV(year: number): Promise<RegnskabData | null> {
  try {
    // Hent CSV-filen fra public-mappen
    const response = await fetch(`/Regnskabsdatabasen/${year}.csv`)
    if (!response.ok) {
      console.warn(`Regnskab for ${year} ikke fundet`)
      return null
    }

    // Decode som ISO-8859-1 (Latin-1)
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('iso-8859-1')
    const content = decoder.decode(buffer)

    // Parse og byg træ
    const parsedLines = parseCSVContent(content)
    return buildTree(parsedLines, year)
  } catch (error) {
    console.warn(`Fejl ved indlæsning af regnskab for ${year}:`, error)
    return null
  }
}

/** Hent tilgængelige år ved at prøve at indlæse hver fil */
export async function fetchAvailableRegnskabYears(): Promise<number[]> {
  const availableYears: number[] = []

  // Prøv at hente hver fil og se hvilke der findes
  for (const year of ALL_POSSIBLE_YEARS) {
    try {
      const response = await fetch(`/Regnskabsdatabasen/${year}.csv`, { method: 'HEAD' })
      if (response.ok) {
        availableYears.push(year)
      }
    } catch {
      // Fil findes ikke, skip
    }
  }

  // Fallback til de kendte filer hvis ingen blev fundet
  if (availableYears.length === 0) {
    return [2022, 2023, 2024]
  }

  return availableYears.sort((a, b) => a - b)
}

/** Parse alle tilgængelige år og kombiner */
export async function parseAllRegnskab(): Promise<Map<number, RegnskabData>> {
  const map = new Map<number, RegnskabData>()

  // Prøv at indlæse alle mulige år
  const results = await Promise.all(
    ALL_POSSIBLE_YEARS.map(async (year) => {
      const data = await parseRegnskabCSV(year)
      return { year, data }
    })
  )

  // Tilføj kun dem der blev indlæst korrekt
  for (const { year, data } of results) {
    if (data) {
      map.set(year, data)
    }
  }

  // Hvis ingen data blev fundet, kast en fejl
  if (map.size === 0) {
    throw new Error('Kunne ikke indlæse nogen regnskabsdata. Tjek at CSV-filerne ligger i public/Regnskabsdatabasen/')
  }

  return map
}

/** Find en node på tværs af år via kode */
export function findNodeAcrossYears(
  code: string,
  allData: Map<number, RegnskabData>
): { year: number; node: RegnskabNode }[] {
  const results: { year: number; node: RegnskabNode }[] = []

  for (const [year, data] of allData) {
    const node = data.index[code]
    if (node) {
      results.push({ year, node })
    }
  }

  return results.sort((a, b) => a.year - b.year)
}
