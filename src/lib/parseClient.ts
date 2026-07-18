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
const REQUEST_TIMEOUT_MS = 30_000

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
  worker: Worker
}

const pending = new Map<number, PendingRequest>()

function asError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error
  return new Error(typeof error === 'string' ? error : fallback)
}

function failWorker(failedWorker: Worker, error: Error): void {
  // En hændelse fra en allerede erstattet worker må ikke påvirke den nye.
  if (worker !== failedWorker) return

  worker = null
  failedWorker.terminate()

  for (const [id, request] of pending) {
    if (request.worker !== failedWorker) continue
    clearTimeout(request.timeout)
    pending.delete(id)
    request.reject(error)
  }
}

function getWorker(): Worker {
  if (!worker) {
    const newWorker = new Worker(new URL('./parseWorker.ts', import.meta.url), { type: 'module' })
    worker = newWorker

    newWorker.onmessage = (e: MessageEvent<ParseResponse>) => {
      const msg = e.data
      const p = pending.get(msg.id)
      // Ignorer svar, der er forsinkede eller kommer fra en erstattet worker.
      if (!p || p.worker !== newWorker) return
      pending.delete(msg.id)
      clearTimeout(p.timeout)
      if (msg.ok) p.resolve(msg.result)
      else p.reject(new Error(msg.error))
    }

    newWorker.onerror = (e) => {
      e.preventDefault()
      const err = new Error(e.message || 'Fejl i parse-worker')
      failWorker(newWorker, err)
    }

    newWorker.onmessageerror = () => {
      failWorker(newWorker, new Error('Kunne ikke afkode svar fra parse-worker'))
    }
  }
  return worker
}

function send<T>(req: DistributiveOmit<ParseRequest, 'id'>): Promise<T> {
  const id = nextId++
  return new Promise<T>((resolve, reject) => {
    let targetWorker: Worker
    try {
      targetWorker = getWorker()
    } catch (error) {
      reject(asError(error, 'Kunne ikke starte parse-worker'))
      return
    }

    const timeout = setTimeout(() => {
      const request = pending.get(id)
      if (!request || request.worker !== targetWorker) return

      failWorker(
        targetWorker,
        new Error(`Parse-worker svarede ikke inden for ${REQUEST_TIMEOUT_MS / 1000} sekunder`),
      )
    }, REQUEST_TIMEOUT_MS)

    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timeout,
      worker: targetWorker,
    })

    try {
      targetWorker.postMessage({ ...req, id })
    } catch (error) {
      failWorker(targetWorker, asError(error, 'Kunne ikke sende til parse-worker'))
    }
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
