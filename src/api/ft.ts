import type { ODataResponse, Sag, Afstemning, Sagstrin } from '../types/ft'

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
  const url = new URL(`${BASE_URL}/${endpoint}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      // OData params must use %24 encoding for $
      const encodedKey = key.replace('$', '%24')
      url.searchParams.set(encodedKey, String(value))
    }
  }
  // URLSearchParams encodes %24 as %2524, so we rebuild manually
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

// Sager
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
  const url = buildUrl(`Sag(${id})`, {
    $expand: 'Sagstrin',
  })
  return fetchApi<Sag>(url)
}

// Afstemninger
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

// Sagstrin for en specifik sag
export async function fetchSagstrin(sagId: number): Promise<ODataResponse<Sagstrin>> {
  const url = buildUrl('Sagstrin', {
    $filter: `sagid eq ${sagId}`,
    $orderby: 'dato desc',
  })
  return fetchApi<ODataResponse<Sagstrin>>(url)
}

// Seneste opdaterede sager (dashboard)
export async function fetchSenesteSager(top: number = 15): Promise<ODataResponse<Sag>> {
  const url = buildUrl('Sag', {
    $top: top,
    $orderby: 'opdateringsdato desc',
    $filter: "typeid eq 3 or typeid eq 5 or typeid eq 8 or typeid eq 20",
  })
  return fetchApi<ODataResponse<Sag>>(url)
}
