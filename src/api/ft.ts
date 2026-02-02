import type { ODataResponse, Sag, Afstemning, Sagstrin, Dokument, Aktør, Emneord, Periode } from '../types/ft'

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
  orderby?: string
} = {}): Promise<ODataResponse<Sag>> {
  const filters: string[] = []
  if (opts.search) {
    filters.push(`substringof('${opts.search}',titel)`)
  }
  if (opts.typeid) {
    filters.push(`typeid eq ${opts.typeid}`)
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

export async function fetchSenesteSager(top: number = 15): Promise<ODataResponse<Sag>> {
  const url = buildUrl('Sag', {
    $top: top,
    $orderby: 'opdateringsdato desc',
    $filter: "typeid eq 3 or typeid eq 5 or typeid eq 8 or typeid eq 20",
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
  })
  return fetchApi<ODataResponse<Sag>>(url)
}
