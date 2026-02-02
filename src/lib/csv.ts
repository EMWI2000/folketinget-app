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

/** Formatér aktstykker som struktureret tekst til ChatGPT */
export function aktstykkerTilChatGpt(sager: Sag[], ministerium?: string): string {
  const statusLabel = (kode: string | null) => {
    switch (kode) {
      case 'TU': return 'Tiltrådt enstemmigt'
      case 'TF': return 'Tiltrådt med flertal'
      case 'IK': return 'Ikke tiltrådt'
      default: return 'Under behandling'
    }
  }

  // Gruppér efter ministerium
  const groups = new Map<string, Sag[]>()
  for (const s of sager) {
    const key = s.paragraf || 'Ukendt'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }

  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)

  let output = `# Aktstykker fra Folketingets Finansudvalg\n`
  if (ministerium) {
    output += `Filtreret: ${ministerium}\n`
  }
  output += `Antal: ${sager.length} aktstykker\n\n`
  output += `Jeg vil gerne have en opsummering af, hvad disse aktstykker handler om. Gruppér gerne efter tema og fremhæv de vigtigste bevillinger. Hvis du kan se beløb eller formål i titlerne, så fremhæv dem.\n\n`
  output += `---\n\n`

  for (const [min, items] of sorted) {
    output += `## ${min} (${items.length} aktstykker)\n\n`
    for (const s of items) {
      const dato = s.afgørelsesdato
        ? new Date(s.afgørelsesdato).toLocaleDateString('da-DK')
        : new Date(s.opdateringsdato).toLocaleDateString('da-DK')
      output += `- **${s.nummer || s.nummerprefix}** — ${s.titel}\n`
      output += `  Status: ${statusLabel(s.afgørelsesresultatkode)} | Dato: ${dato}\n`
      if (s.resume) {
        output += `  Resume: ${s.resume.substring(0, 300)}\n`
      }
      output += `\n`
    }
  }

  return output
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
