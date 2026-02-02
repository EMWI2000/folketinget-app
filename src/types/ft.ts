export interface Sag {
  id: number
  typeid: number
  kategoriid: number | null
  statusid: number
  titel: string
  titelkort: string
  offentlighedskode: string
  nummer: string
  nummerprefix: string
  nummernumerisk: string
  nummerpostfix: string
  resume: string | null
  afstemningskonklusion: string | null
  periodeid: number
  afgørelsesresultatkode: string | null
  baggrundsmateriale: string | null
  opdateringsdato: string
  statsbudgetsag: boolean
  bpiession: string | null
  dagsordenspunktid: number | null
  lovnummer: string | null
  lovnummerdato: string | null
  retsinformationsurl: string | null
  fremsatunder: string | null
  deltundersagid: number | null
  superid: number | null
  Sagstrin?: Sagstrin[]
}

export interface Sagstrin {
  id: number
  titel: string
  dato: string
  sagid: number
  typeid: number
  folketingstidendeurl: string | null
  folketingstidende: string
  folketingstidendesidenummer: string
  statusid: number
  opdateringsdato: string
}

export interface Afstemning {
  id: number
  nummer: number
  konklusion: string
  vedtaget: boolean
  kommentar: string | null
  mødeId: number
  typeId: number
  sagstrinId: number
  opdateringsdato: string
}

export interface Aktør {
  id: number
  typeid: number
  gruppenavnkort: string | null
  navn: string
  fornavn: string | null
  efternavn: string | null
  biografi: string | null
  periodeid: number | null
  opdateringsdato: string
  startdato: string | null
  slutdato: string | null
}

export interface ODataResponse<T> {
  'odata.metadata': string
  'odata.count'?: string
  value: T[]
}

export const SAG_TYPER: Record<number, string> = {
  3: 'Lovforslag',
  5: 'Beslutningsforslag',
  7: 'EU-LovgivningSag',
  8: 'Forespørgsel',
  9: 'Redegørelse',
  10: 'Alm. del',
  11: '§ 20-spørgsmål',
  13: 'Aktstykke',
  15: 'Undersøgelseskommission',
  17: 'Lovforslag som fremsat',
  20: 'Borgerforslag',
}

export const SAG_STATUS: Record<number, string> = {
  12: 'Under behandling',
  17: 'Fremsat',
  20: 'Vedtaget',
  25: 'Bortfaldet',
  28: 'Forkastet',
  48: 'Afsluttet',
  54: 'Modtaget',
}
