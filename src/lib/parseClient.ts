/**
 * Klient-side helper til parse-workeren. Holder én delt worker-instans og
 * korrelerer forespørgsler/svar via et løbende id, så flere kald kan køre samtidig.
 */
import type { FinanslovData } from './finanslov/types'
import type { RegnskabData } from './regnskab/types'
import type { LoenRaekke } from './loendata/types'
import type { ParseRequest, ParseResponse } from './parseWorker'

/** Omit der fordeler sig over union-medlemmer (bevarer diskriminanten + felter). */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never

let worker: Worker | null = null
let nextId = 0
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./parseWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<ParseResponse>) => {
      const msg = e.data
      const p = pending.get(msg.id)
      if (!p) return
      pending.delete(msg.id)
      if (msg.ok) p.resolve(msg.result)
      else p.reject(new Error(msg.error))
    }
    worker.onerror = (e) => {
      const err = new Error(e.message || 'Fejl i parse-worker')
      for (const p of pending.values()) p.reject(err)
      pending.clear()
    }
  }
  return worker
}

function send<T>(req: DistributiveOmit<ParseRequest, 'id'>): Promise<T> {
  const id = nextId++
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
    getWorker().postMessage({ ...req, id })
  })
}

export const parseFinanslovInWorker = (year: number) =>
  send<FinanslovData | null>({ type: 'finanslov-year', year })

export const parseAllFinanslovInWorker = () =>
  send<Map<number, FinanslovData>>({ type: 'finanslov-all' })

export const parseRegnskabInWorker = (year: number) =>
  send<RegnskabData | null>({ type: 'regnskab-year', year })

export const parseAllRegnskabInWorker = () =>
  send<Map<number, RegnskabData>>({ type: 'regnskab-all' })

export const parseLoendataInWorker = (url: string) =>
  send<LoenRaekke[]>({ type: 'loendata', url })
