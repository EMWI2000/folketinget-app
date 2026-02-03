import type { ODataResponse, Sag, Afstemning, Sagstrin, Dokument, Aktør, Emneord, Periode, SagDokument, SagAktørRelation } from '../types/ft'

const BASE_URL = 'https://oda.ft.dk/api'

interface QueryParams {
  $top?: number
  $skip?: number
  $filter?: string
  $orderby?: string
  $expand?: string
  $select?: string
  $inlinecount?: string
}

function buildUrl(endpoint: string, params: QueryParams = {}): string {
  const paramStr = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k.replace('$', '%24')}=${encodeURIComponent(String(v))}`)
    .join('&')
  return paramStr ? `${BASE_URL}/${endpoint}?${paramStr}` : `${BASE_URL}/${endpoint}`
}

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`API fejl: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// ─── Sager ───────────────────────────────────────────────

export async function fetchSager(opts: {
  top?: number
  skip?: number
  search?: string
  typeid?: number
  periodeid?: number
  orderby?: string
} = {}): Promise<ODataResponse<Sag>> {
  const filters: string[] = []
  if (opts.search) {
    filters.push(`substringof('${opts.search}',titel)`)
  }
  if (opts.typeid) {
    filters.push(`typeid eq ${opts.typeid}`)
  }
  if (opts.periodeid) {
    filters.push(`periodeid eq ${opts.periodeid}`)
  }
  const url = buildUrl('Sag', {
    $top: opts.top ?? 20,
    $skip: opts.skip ?? 0,
    $filter: filters.length > 0 ? filters.join(' and ') : undefined,
    $orderby: opts.orderby ?? 'opdateringsdato desc',
    $inlinecount: 'allpages',
  })
  return fetchApi<ODataResponse<Sag>>(url)
}

export async function fetchSag(id: number): Promise<Sag> {
  // Byg URL manuelt for at undgå double-encoding af Aktør (ø = %C3%B8)
  const url = `${BASE_URL}/Sag(${id})?%24expand=Sagstrin,SagDokument,SagAkt%C3%B8r,EmneordSag`
  return fetchApi<Sag>(url)
}

// ─── Afstemninger ────────────────────────────────────────

export async function fetchAfstemninger(opts: {
  top?: number
  skip?: number
} = {}): Promise<ODataResponse<Afstemning>> {
  const url = buildUrl('Afstemning', {
    $top: opts.top ?? 10,
    $skip: opts.skip ?? 0,
    $orderby: 'opdateringsdato desc',
  })
  return fetchApi<ODataResponse<Afstemning>>(url)
}

// ─── Sagstrin ────────────────────────────────────────────

export async function fetchSagstrin(sagId: number): Promise<ODataResponse<Sagstrin>> {
  const url = buildUrl('Sagstrin', {
    $filter: `sagid eq ${sagId}`,
    $orderby: 'dato desc',
  })
  return fetchApi<ODataResponse<Sagstrin>>(url)
}

// ─── Seneste (dashboard) ────────────────────────────────

export async function fetchSenesteSager(top: number = 15, periodeid?: number): Promise<ODataResponse<Sag>> {
  const baseFilter = "typeid eq 3 or typeid eq 5 or typeid eq 8 or typeid eq 20"
  const filter = periodeid
    ? `(${baseFilter}) and periodeid eq ${periodeid}`
    : baseFilter
  const url = buildUrl('Sag', {
    $top: top,
    $orderby: 'opdateringsdato desc',
    $filter: filter,
  })
  return fetchApi<ODataResponse<Sag>>(url)
}

// ─── Dokumenter med filer ────────────────────────────────

export async function fetchDokument(dokumentId: number): Promise<Dokument> {
  const url = buildUrl(`Dokument(${dokumentId})`, {
    $expand: 'Fil',
  })
  return fetchApi<Dokument>(url)
}

export async function fetchDokumenter(dokumentIds: number[]): Promise<Dokument[]> {
  const results = await Promise.all(
    dokumentIds.map((id) => fetchDokument(id).catch(() => null))
  )
  return results.filter((d): d is Dokument => d !== null)
}

// ─── Aktører ─────────────────────────────────────────────

export async function fetchAktør(aktørId: number): Promise<Aktør> {
  const url = buildUrl(`Akt%C3%B8r(${aktørId})`)
  return fetchApi<Aktør>(url)
}

export async function fetchAktører(aktørIds: number[]): Promise<Aktør[]> {
  const unique = [...new Set(aktørIds)]
  const results = await Promise.all(
    unique.map((id) => fetchAktør(id).catch(() => null))
  )
  return results.filter((a): a is Aktør => a !== null)
}

// ─── Emneord ─────────────────────────────────────────────

export async function fetchEmneord(emneordId: number): Promise<Emneord> {
  const url = buildUrl(`Emneord(${emneordId})`)
  return fetchApi<Emneord>(url)
}

export async function fetchEmneordBatch(emneordIds: number[]): Promise<Emneord[]> {
  const unique = [...new Set(emneordIds)]
  const results = await Promise.all(
    unique.map((id) => fetchEmneord(id).catch(() => null))
  )
  return results.filter((e): e is Emneord => e !== null)
}

export async function fetchAlleEmneordSager(top: number = 500): Promise<ODataResponse<{ id: number; emneordid: number; sagid: number; opdateringsdato: string }>> {
  const url = buildUrl('EmneordSag', {
    $top: top,
    $orderby: 'opdateringsdato desc',
  })
  return fetchApi(url)
}

// ─── Statistik ───────────────────────────────────────────

export async function fetchSagerCount(filter?: string): Promise<number> {
  const url = buildUrl('Sag', {
    $top: 0,
    $filter: filter,
    $inlinecount: 'allpages',
  })
  const res = await fetchApi<ODataResponse<Sag>>(url)
  return parseInt(res['odata.count'] ?? '0', 10)
}

export async function fetchAfstemningerCount(): Promise<number> {
  const url = buildUrl('Afstemning', {
    $top: 0,
    $inlinecount: 'allpages',
  })
  const res = await fetchApi<ODataResponse<Afstemning>>(url)
  return parseInt(res['odata.count'] ?? '0', 10)
}

// ─── Perioder ────────────────────────────────────────────

export async function fetchPerioder(): Promise<Periode[]> {
  const url = buildUrl('Periode', {
    $top: 20,
    $orderby: 'id desc',
  })
  const res = await fetchApi<ODataResponse<Periode>>(url)
  return res.value
}

// ─── Aktstykker ──────────────────────────────────────────

export async function fetchAktstykker(periodeid: number): Promise<ODataResponse<Sag>> {
  const url = buildUrl('Sag', {
    $filter: `substringof('Aktstk',nummerprefix) and periodeid eq ${periodeid}`,
    $orderby: 'nummernumerisk desc',
    $top: 300,
    $expand: 'SagDokument',
  })
  return fetchApi<ODataResponse<Sag>>(url)
}

// ─── Medlemmer ──────────────────────────────────────────

/** Søg efter MF'ere (typeid=5) med navn-søgning */
export async function fetchSoegMedlemmer(navn: string): Promise<Aktør[]> {
  const url = `${BASE_URL}/Akt%C3%B8r?%24filter=typeid%20eq%205%20and%20substringof('${encodeURIComponent(navn)}',navn)&%24top=50&%24orderby=efternavn&%24select=id,navn,fornavn,efternavn,typeid,gruppenavnkort,startdato,slutdato,opdateringsdato,periodeid,biografi`
  const res = await fetchApi<ODataResponse<Aktør>>(url)
  return res.value
}

/** Hent parti for et bestemt MF via AktørAktør (rolleid=15, tilaktør typeid=4) */
export async function fetchMedlemParti(aktørId: number): Promise<string | null> {
  try {
    // Hent alle aktive "medlem" relationer for denne aktør
    const url = `${BASE_URL}/Akt%C3%B8rAkt%C3%B8r?%24filter=fraakt%C3%B8rid%20eq%20${aktørId}%20and%20rolleid%20eq%2015%20and%20slutdato%20eq%20null&%24top=20`
    const res = await fetchApi<ODataResponse<{ id: number; fraaktørid: number; tilaktørid: number; rolleid: number; slutdato: string | null }>>(url)

    if (res.value.length === 0) return null

    // Hent de tilknyttede aktører og find den der er et parti (typeid=4)
    const tilIds = res.value.map(r => r.tilaktørid)
    const aktører = await fetchAktører(tilIds)
    const parti = aktører.find(a => a.typeid === 4)
    return parti?.navn ?? null
  } catch {
    return null
  }
}

/** Hent sager for et bestemt MF, evt. filtreret på rolle og periode */
export async function fetchMedlemSager(opts: {
  aktørId: number
  rolleid?: number
  periodeid?: number
  top?: number
  skip?: number
}): Promise<ODataResponse<SagAktørRelation>> {
  const filters = [`akt%C3%B8rid eq ${opts.aktørId}`]
  if (opts.rolleid) {
    filters.push(`rolleid eq ${opts.rolleid}`)
  }
  const filterStr = filters.join(' and ')
  // Vi kan ikke filtrere på Sag.periodeid direkte i SagAktør, men $expand=Sag giver os sagen
  const url = `${BASE_URL}/SagAkt%C3%B8r?%24filter=${filterStr}&%24top=${opts.top ?? 20}&%24skip=${opts.skip ?? 0}&%24orderby=opdateringsdato%20desc&%24expand=Sag&%24inlinecount=allpages`
  const res = await fetchApi<ODataResponse<SagAktørRelation>>(url)
  return res
}

/** Hent PDF-URL for et aktstykke via SagDokument → Dokument → Fil */
export async function fetchAktstykkePdfUrl(sagId: number, sagDokumenter?: SagDokument[]): Promise<string | null> {
  try {
    // Brug medfølgende SagDokument eller hent dem
    let docs = sagDokumenter
    if (!docs || docs.length === 0) {
      const sag = await fetchSag(sagId)
      docs = sag.SagDokument
    }
    if (!docs || docs.length === 0) return null

    // Hent første dokument med filer
    for (const sd of docs) {
      const dok = await fetchDokument(sd.dokumentid)
      if (dok.Fil && dok.Fil.length > 0) {
        // Foretruk PDF-filer
        const pdf = dok.Fil.find(f => f.format?.toLowerCase() === 'pdf') || dok.Fil[0]
        return pdf.filurl
      }
    }
    return null
  } catch {
    return null
  }
}
