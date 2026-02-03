import type { ODataResponse, Sag, Afstemning, Sagstrin, Dokument, Aktør, Emneord, Periode, SagDokument, AktørAktør, MedlemMedParti, SagAktørRelation } from '../types/ft'

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

/** Hent alle aktive folketingsmedlemmer (typeid=5, ingen slutdato) */
export async function fetchMedlemmer(): Promise<Aktør[]> {
  // Hent i batches af 200 da der er ~180 aktive MF'ere
  const url = `${BASE_URL}/Akt%C3%B8r?%24filter=typeid%20eq%205%20and%20slutdato%20eq%20null&%24top=300&%24orderby=efternavn&%24select=id,navn,fornavn,efternavn,typeid,gruppenavnkort,startdato,slutdato,opdateringsdato,periodeid,biografi`
  const res = await fetchApi<ODataResponse<Aktør>>(url)
  return res.value
}

/** Hent alle aktive partimedlemskaber (AktørAktør rolleid=15, slutdato eq null) */
export async function fetchAktivePartimedlemskaber(): Promise<AktørAktør[]> {
  const url = `${BASE_URL}/Akt%C3%B8rAkt%C3%B8r?%24filter=rolleid%20eq%2015%20and%20slutdato%20eq%20null&%24top=500&%24inlinecount=allpages`
  const res = await fetchApi<ODataResponse<AktørAktør>>(url)
  return res.value
}

/** Hent partier (typeid=4) — returnerer unikke partinavne */
export async function fetchPartier(): Promise<Aktør[]> {
  const url = `${BASE_URL}/Akt%C3%B8r?%24filter=typeid%20eq%204&%24top=500&%24orderby=navn&%24select=id,navn,typeid,gruppenavnkort,fornavn,efternavn,startdato,slutdato,opdateringsdato,periodeid,biografi`
  const res = await fetchApi<ODataResponse<Aktør>>(url)
  return res.value
}

/** Hent alle aktive MF'ere med parti-info samlet */
export async function fetchMedlemmerMedParti(): Promise<MedlemMedParti[]> {
  const [medlemmer, medlemskaber, partier] = await Promise.all([
    fetchMedlemmer(),
    fetchAktivePartimedlemskaber(),
    fetchPartier(),
  ])

  // Byg parti-lookup: partiAktørId → partinavn
  const partiNavne = new Map<number, string>()
  for (const p of partier) {
    if (!partiNavne.has(p.id)) {
      partiNavne.set(p.id, p.navn)
    }
  }

  // Byg medlemskab-lookup: MF aktørid → partiAktørId
  const medlemParti = new Map<number, number>()
  for (const m of medlemskaber) {
    medlemParti.set(m.fraaktørid, m.tilaktørid)
  }

  return medlemmer.map((m) => {
    const partiId = medlemParti.get(m.id)
    const partiNavn = partiId ? partiNavne.get(partiId) ?? null : null
    // Udtræk kort partinavn fra fuldt navn, f.eks. "Socialdemokratiet" → "S"
    const partiKort = partiNavn ? partiNavn.replace(/^(.+?)\s*[-–].*$/, '$1').trim() : null
    return {
      id: m.id,
      navn: m.navn,
      fornavn: m.fornavn,
      efternavn: m.efternavn,
      parti: partiNavn,
      partiKort,
    }
  }).sort((a, b) => (a.efternavn ?? '').localeCompare(b.efternavn ?? '', 'da'))
}

/** Hent sager for et bestemt MF, evt. filtreret på rolle */
export async function fetchMedlemSager(opts: {
  aktørId: number
  rolleid?: number
  top?: number
  skip?: number
}): Promise<ODataResponse<SagAktørRelation>> {
  const filters = [`akt%C3%B8rid eq ${opts.aktørId}`]
  if (opts.rolleid) {
    filters.push(`rolleid eq ${opts.rolleid}`)
  }
  const filterStr = filters.join(' and ')
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
