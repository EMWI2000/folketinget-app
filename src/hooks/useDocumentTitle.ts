import { useEffect } from 'react'

const SUFFIX = 'Folketinget - Åbne Data'

/**
 * Sætter dokumentets <title> pr. side, så hver rute får en sigende titel
 * (bedre for browserhistorik, faner, bogmærker og søgemaskiner).
 *
 * @param title Sidens titel. Udelades for forsiden (kun suffikset vises).
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX
  }, [title])
}
