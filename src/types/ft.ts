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
  paragraf: string | null
  paragrafnummer: number | null
  afgørelsesdato: string | null
  afgørelse: string | null
  fremsatunder: string | null
  deltundersagid: number | null
  superid: number | null
  Sagstrin?: Sagstrin[]
  SagDokument?: SagDokument[]
  SagAktør?: SagAktørRelation[]
  EmneordSag?: EmneordSagRelation[]
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

export interface SagDokument {
  id: number
  sagid: number
  dokumentid: number
  bilagsnummer: string
  frigivelsesdato: string
  opdateringsdato: string
  rolleid: number
}

export interface SagAktørRelation {
  id: number
  aktørid: number
  sagid: number
  opdateringsdato: string
  rolleid: number
}

export interface EmneordSagRelation {
  id: number
  emneordid: number
  sagid: number
  opdateringsdato: string
}

export interface Dokument {
  id: number
  typeid: number
  kategoriid: number
  statusid: number
  offentlighedskode: string
  titel: string
  dato: string
  modtagelsesdato: string | null
  frigivelsesdato: string | null
  opdateringsdato: string
  Fil?: Fil[]
}

export interface Fil {
  id: number
  dokumentid: number
  titel: string
  versionsdato: string
  filurl: string
  opdateringsdato: string
  variantkode: string
  format: string
}

export interface Emneord {
  id: number
  typeid: number
  emneord: string
  opdateringsdato: string
}

export interface AktørMedRolle extends Aktør {
  rolleid: number
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

export interface Periode {
  id: number
  typeid: number
  kode: string
  titel: string
  startdato: string
  slutdato: string
  opdateringsdato: string
}

// Sag har også disse felter for aktstykker
export interface SagMedParagraf extends Sag {
  paragraf: string | null
  paragrafnummer: number | null
  afgørelsesresultatkode: string | null
  afgørelsesdato: string | null
  afgørelse: string | null
}

export const AKTØR_ROLLER: Record<number, string> = {
  6: 'Forslagsstiller',
  9: 'Rådgiver',
  11: 'Ordfører',
  14: 'Minister',
  16: 'Medunderskriver',
}
