const STORAGE_KEY = 'ft-watchlist'

export interface WatchItem {
  id: string
  label: string
  type: 'ministerium' | 'sagstype' | 'emneord' | 'fritekst'
  createdAt: string
}

export function getWatchlist(): WatchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addWatchItem(item: Omit<WatchItem, 'id' | 'createdAt'>): void {
  const list = getWatchlist()
  if (list.some((w) => w.label === item.label && w.type === item.type)) return
  list.unshift({
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event('watchlist-changed'))
}

export function removeWatchItem(id: string): void {
  const list = getWatchlist().filter((w) => w.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event('watchlist-changed'))
}
