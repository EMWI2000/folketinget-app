/** Parse dansk talformat (f.eks. "1.234,5" → 1234.5) */
export function parseDanishNumber(str: string): number {
  if (!str || str.trim() === '') return 0
  // Fjern tusindtalsseparator (.), erstat decimalseparator (,) med (.)
  const normalized = str.trim().replace(/\./g, '').replace(',', '.')
  const num = parseFloat(normalized)
  return isNaN(num) ? 0 : num
}

/** Formatér tal til dansk format (f.eks. 1234.5 → "1.234,5") */
export function formatDanishNumber(value: number, decimals: number = 1): string {
  return value.toLocaleString('da-DK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Formatér regnskabsværdi med enhed (mio. kr.) */
export function formatRegnskabValue(value: number): string {
  const formatted = formatDanishNumber(value, 1)
  return `${formatted} mio. kr.`
}

/** Formatér regnskab (simpel, uden enhed) */
export function formatRegnskab(value: number): string {
  return formatDanishNumber(value, 1)
}

/** Formatér regnskabsværdi kompakt (f.eks. "1,2 mia." eller "234 mio.") */
export function formatRegnskabCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1000) {
    // Milliarder
    return `${sign}${formatDanishNumber(abs / 1000, 1)} mia.`
  }
  // Millioner
  return `${sign}${formatDanishNumber(abs, 0)} mio.`
}

/** Formatér procent-ændring */
export function formatChange(oldValue: number, newValue: number): string {
  if (oldValue === 0) return newValue === 0 ? '0%' : '∞'
  const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100
  const sign = change > 0 ? '+' : ''
  return `${sign}${formatDanishNumber(change, 1)}%`
}
