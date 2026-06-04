/**
 * Delt logik til at identificere styrelser ud fra kontonavn. Bruges af både
 * finanslov- og regnskabsmodulet, som ellers har hver sin node-type.
 */

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

/**
 * Tjek om en node er en styrelse. Styrelser ligger KUN på hovedkonto-niveau
 * (6-cifret kode) og genkendes via navnemønstre.
 */
export function isAgencyNode(node: { level: string; name: string }): boolean {
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
