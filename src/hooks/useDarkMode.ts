import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('ft-dark-mode') === 'true'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('ft-dark-mode', String(dark))
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}
