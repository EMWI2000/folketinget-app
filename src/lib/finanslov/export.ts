import type { BudgetNode } from './types'
import { formatDanishNumber } from './formatter'

/** Eksportér noder til CSV-format */
export function budgetNodesToCSV(nodes: BudgetNode[], includeChildren: boolean = false): string {
  const header = 'Kode;Navn;Niveau;R;B;F;BO1;BO2;BO3;År'
  const rows: string[] = [header]

  function addNode(node: BudgetNode) {
    const row = [
      node.code,
      `"${node.name.replace(/"/g, '""')}"`, // Escape quotes
      node.level,
      formatDanishNumber(node.values.R, 1),
      formatDanishNumber(node.values.B, 1),
      formatDanishNumber(node.values.F, 1),
      formatDanishNumber(node.values.BO1, 1),
      formatDanishNumber(node.values.BO2, 1),
      formatDanishNumber(node.values.BO3, 1),
      node.year.toString(),
    ].join(';')

    rows.push(row)

    if (includeChildren) {
      for (const child of node.children) {
        addNode(child)
      }
    }
  }

  for (const node of nodes) {
    addNode(node)
  }

  return rows.join('\n')
}

/** Download CSV-fil */
export function downloadCSV(content: string, filename: string) {
  // UTF-8 BOM for korrekt encoding i Excel
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/** Eksportér sammenligning til CSV */
export function exportComparisonCSV(nodes: BudgetNode[]) {
  const csv = budgetNodesToCSV(nodes, false)
  const timestamp = new Date().toISOString().slice(0, 10)
  downloadCSV(csv, `finanslov-sammenligning-${timestamp}.csv`)
}

/** Eksportér hele træet for et år */
export function exportYearCSV(nodes: BudgetNode[], year: number) {
  const csv = budgetNodesToCSV(nodes, true)
  downloadCSV(csv, `finanslov-${year}.csv`)
}
