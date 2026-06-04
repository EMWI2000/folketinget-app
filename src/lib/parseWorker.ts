/// <reference lib="webworker" />
/**
 * Web Worker der udfører den tunge CSV-hentning og -parsing uden for main thread,
 * så UI'et ikke fryser mens finanslovs-, regnskabs- og løndata indlæses.
 */
import { parseFinanslovCSV, parseAllFinanslov } from './finanslov/parser'
import { parseRegnskabCSV, parseAllRegnskab } from './regnskab/parser'
import { parseLoenCSV } from './loendata/parser'

export type ParseRequest =
  | { id: number; type: 'finanslov-year'; year: number }
  | { id: number; type: 'finanslov-all' }
  | { id: number; type: 'regnskab-year'; year: number }
  | { id: number; type: 'regnskab-all' }
  | { id: number; type: 'loendata'; url: string }

export type ParseResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string }

// `self` er worker-global scope; cast til Worker giver os den korrekte
// single-argument postMessage-signatur uden at skulle blande WebWorker-lib ind.
const ctx = self as unknown as Worker

ctx.onmessage = async (e: MessageEvent<ParseRequest>) => {
  const req = e.data
  try {
    let result: unknown
    switch (req.type) {
      case 'finanslov-year':
        result = await parseFinanslovCSV(req.year)
        break
      case 'finanslov-all':
        result = await parseAllFinanslov()
        break
      case 'regnskab-year':
        result = await parseRegnskabCSV(req.year)
        break
      case 'regnskab-all':
        result = await parseAllRegnskab()
        break
      case 'loendata': {
        const res = await fetch(req.url)
        if (!res.ok) throw new Error('Kunne ikke hente løndata')
        result = parseLoenCSV(await res.text())
        break
      }
    }
    const response: ParseResponse = { id: req.id, ok: true, result }
    ctx.postMessage(response)
  } catch (err) {
    const response: ParseResponse = {
      id: req.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
    ctx.postMessage(response)
  }
}
