import { useState, useEffect, useCallback } from 'react'
import { getWatchlist, addWatchItem, removeWatchItem, type WatchItem } from '../lib/watchlist'

export function useWatchlist() {
  const [items, setItems] = useState<WatchItem[]>(getWatchlist)

  useEffect(() => {
    const handler = () => setItems(getWatchlist())
    window.addEventListener('watchlist-changed', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('watchlist-changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const add = useCallback((item: Omit<WatchItem, 'id' | 'createdAt'>) => {
    addWatchItem(item)
    setItems(getWatchlist())
  }, [])

  const remove = useCallback((id: string) => {
    removeWatchItem(id)
    setItems(getWatchlist())
  }, [])

  return { items, add, remove }
}
