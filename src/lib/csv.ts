import type { Sag } from '../types/ft'

export function aktstykkerToCsv(sager: Sag[]): string {
  const header = ['Nummer', 'Titel', 'Ministerium', 'Status', 'Afgørelsesdato', 'Opdateringsdato']
  const rows = sager.map((s) => [
    s.nummer || s.nummerprefix,
    '"' + (s.titelkort || s.titel).replace(/"/g, '""') + '"',
    '"' + (s.paragraf || 'Ukendt').replace(/"/g, '""') + '"',
    s.afgørelsesresultatkode || 'Under behandling',
    s.afgørelsesdato ? new Date(s.afgørelsesdato).toLocaleDateString('da-DK') : '',
    new Date(s.opdateringsdato).toLocaleDateString('da-DK'),
  ])
  return [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
}

export function downloadCsv(csv: string, filename: string): void {
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
