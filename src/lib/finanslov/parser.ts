import type { BudgetNode, BudgetValues, HierarchyLevel, FinanslovData } from './types'
import { parseDanishNumber } from './formatter'

interface ParsedLine {
  code: string
  name: string
  values: BudgetValues
  codeLength: number
}

/** Parse en enkelt linje fra CSV */
function parseLine(line: string): ParsedLine | null {
  if (!line.trim()) return null

  const parts = line.split(';')
  if (parts.length < 7) return null

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

  // Parse de 6 værdikolonner
  const values: BudgetValues = {
    R: parseDanishNumber(parts[1]),
    B: parseDanishNumber(parts[2]),
    F: parseDanishNumber(parts[3]),
    BO1: parseDanishNumber(parts[4]),
    BO2: parseDanishNumber(parts[5]),
    BO3: parseDanishNumber(parts[6]),
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
 * KRITISK: 2-cifrede koder er tvetydige:
 * - Paragraf (ministerium) hvis næste linje har 3-cifret kode med samme prefix
 * - Standardkonto (udgiftstype) hvis ikke
 */
function determineLevel(
  code: string,
  codeLength: number,
  nextCode: string | null
): HierarchyLevel {
  if (codeLength === 2) {
    // Look-ahead: er næste linje en 3-cifret under denne paragraf?
    if (nextCode && nextCode.length === 3 && nextCode.startsWith(code)) {
      return 'paragraf'
    }
    return 'standardkonto'
  }

  switch (codeLength) {
    case 3: return 'hovedomraade'
    case 4: return 'aktivitetsomraade'
    case 6: return 'hovedkonto'
    case 8: return 'underkonto'
    default: return 'standardkonto' // Fallback
  }
}

/** Find parent-kode baseret på niveau */
function findParentCode(code: string, level: HierarchyLevel, lastUnderkontoCode: string | null): string | null {
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
    case 'standardkonto':
      return lastUnderkontoCode // Barn af seneste 8-cifrede
    default:
      return null
  }
}

/** Parse CSV-indhold til flad liste af noder */
function parseCSVContent(content: string, _year: number): ParsedLine[] {
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
function buildTree(parsedLines: ParsedLine[], year: number): FinanslovData {
  const nodes: BudgetNode[] = []
  const index: Record<string, BudgetNode> = {}
  const tree: BudgetNode[] = []

  // Stack til at tracke parent-kæden
  let lastUnderkontoCode: string | null = null

  for (let i = 0; i < parsedLines.length; i++) {
    const line = parsedLines[i]
    const nextLine = parsedLines[i + 1]

    const level = determineLevel(
      line.code,
      line.codeLength,
      nextLine?.code ?? null
    )

    // Opdater lastUnderkontoCode hvis dette er en underkonto
    if (level === 'underkonto') {
      lastUnderkontoCode = line.code
    }

    const parentCode = findParentCode(line.code, level, lastUnderkontoCode)

    const node: BudgetNode = {
      id: `${year}-${line.code}`,
      code: line.code,
      name: line.name,
      level,
      values: line.values,
      year,
      children: [],
      parentCode,
    }

    nodes.push(node)
    index[line.code] = node

    // Tilføj til parent's children eller til root
    if (parentCode && index[parentCode]) {
      index[parentCode].children.push(node)
    } else if (level === 'paragraf') {
      tree.push(node)
    }
    // Standardkonti uden parent-match ignoreres (shouldn't happen med korrekt data)
  }

  return { year, tree, nodes, index }
}

/** Alle mulige finanslovsår - opdater denne liste når nye filer tilføjes */
const ALL_POSSIBLE_YEARS = [2021, 2022, 2023, 2024, 2025, 2026]

/** Hent og parse finanslovs-CSV for et givet år - returnerer null hvis filen ikke findes */
export async function parseFinanslovCSV(year: number): Promise<FinanslovData | null> {
  try {
    // Hent CSV-filen fra public-mappen
    const response = await fetch(`/Finanslovsdatabasen/${year}.csv`)
    if (!response.ok) {
      console.warn(`Finanslov for ${year} ikke fundet`)
      return null
    }

    // Decode som ISO-8859-1 (Latin-1)
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('iso-8859-1')
    const content = decoder.decode(buffer)

    // Parse og byg træ
    const parsedLines = parseCSVContent(content, year)
    return buildTree(parsedLines, year)
  } catch (error) {
    console.warn(`Fejl ved indlæsning af finanslov for ${year}:`, error)
    return null
  }
}

/** Hent tilgængelige år ved at prøve at indlæse hver fil */
export async function fetchAvailableYears(): Promise<number[]> {
  const availableYears: number[] = []

  // Prøv at hente hver fil og se hvilke der findes
  for (const year of ALL_POSSIBLE_YEARS) {
    try {
      const response = await fetch(`/Finanslovsdatabasen/${year}.csv`, { method: 'HEAD' })
      if (response.ok) {
        availableYears.push(year)
      }
    } catch {
      // Fil findes ikke, skip
    }
  }

  // Fallback til de kendte filer hvis ingen blev fundet
  if (availableYears.length === 0) {
    return [2024, 2025, 2026]
  }

  return availableYears.sort((a, b) => a - b)
}

/** Parse alle tilgængelige år og kombiner */
export async function parseAllFinanslov(): Promise<Map<number, FinanslovData>> {
  const map = new Map<number, FinanslovData>()

  // Prøv at indlæse alle mulige år
  const results = await Promise.all(
    ALL_POSSIBLE_YEARS.map(async (year) => {
      const data = await parseFinanslovCSV(year)
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
    throw new Error('Kunne ikke indlæse nogen finanslovsdata. Tjek at CSV-filerne ligger i public/Finanslovsdatabasen/')
  }

  return map
}

/** Find en node på tværs af år via kode */
export function findNodeAcrossYears(
  code: string,
  allData: Map<number, FinanslovData>
): { year: number; node: BudgetNode }[] {
  const results: { year: number; node: BudgetNode }[] = []

  for (const [year, data] of allData) {
    const node = data.index[code]
    if (node) {
      results.push({ year, node })
    }
  }

  return results.sort((a, b) => a.year - b.year)
}
