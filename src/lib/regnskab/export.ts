import type { RegnskabNode } from './types'
import { formatDanishNumber } from './formatter'

/** Eksportér sammenligning af noder som CSV */
export function exportRegnskabComparisonCSV(nodes: RegnskabNode[]): void {
  const headers = ['Kode', 'Navn', 'År', 'År 1 (mio. kr.)', 'År 2 (mio. kr.)']
  const rows = nodes.map((node) => [
    node.code,
    node.name,
    node.year.toString(),
    formatDanishNumber(node.values.year1, 1),
    formatDanishNumber(node.values.year2, 1),
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(';')).join('\n')
  downloadCSV(csv, `regnskab-sammenligning-${new Date().toISOString().slice(0, 10)}.csv`)
}

/** Eksportér hele årets data som CSV */
export function exportRegnskabYearCSV(nodes: RegnskabNode[], year: number): void {
  const headers = ['Kode', 'Navn', 'Niveau', 'År 1 (mio. kr.)', 'År 2 (mio. kr.)']
  const rows = nodes.map((node) => [
    node.code,
    node.name,
    node.level,
    formatDanishNumber(node.values.year1, 1),
    formatDanishNumber(node.values.year2, 1),
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(';')).join('\n')
  downloadCSV(csv, `regnskabsdatabasen-${year}.csv`)
}

/** Download CSV-fil */
function downloadCSV(content: string, filename: string): void {
  // Brug ISO-8859-1 encoding for kompatibilitet med Excel
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
