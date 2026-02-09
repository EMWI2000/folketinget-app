import { useState, useCallback } from 'react'
import type { BudgetNode, CompareItem, FinanslovData } from '../../lib/finanslov/types'
import { COMPARE_COLORS } from '../../lib/finanslov/types'
import CompareCard from './CompareCard'

interface CompareCanvasProps {
  items: CompareItem[]
  onAddItem: (node: BudgetNode) => void
  onRemoveItem: (index: number) => void
  allData?: Map<number, FinanslovData>
}

export default function CompareCanvas({
  items,
  onAddItem,
  onRemoveItem,
  allData,
}: CompareCanvasProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      try {
        const data = e.dataTransfer.getData('application/json')
        const node = JSON.parse(data) as BudgetNode

        // Tjek om noden allerede er tilføjet (samme kode + år)
        const alreadyExists = items.some(
          (item) => item.node.code === node.code && item.node.year === node.year
        )
        if (!alreadyExists && items.length < COMPARE_COLORS.length) {
          onAddItem(node)
        }
      } catch (err) {
        console.error('Kunne ikke parse droppet element:', err)
      }
    },
    [items, onAddItem]
  )

  // Find forrige års node for ændringsvisning
  const getPreviousYearNode = useCallback(
    (node: BudgetNode): BudgetNode | null => {
      if (!allData || node.year === 2024) return null

      const previousYear = node.year - 1
      const previousData = allData.get(previousYear)
      if (!previousData) return null

      return previousData.index[node.code] ?? null
    },
    [allData]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sammenligning
        </h3>
        {items.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} / {COMPARE_COLORS.length} valgt
          </span>
        )}
      </div>

      {/* Drop-zone / cards */}
      <div
        className={`
          flex-1 min-h-[200px] rounded-xl border-2 border-dashed transition-colors
          ${
            isDragOver
              ? 'border-ft-red bg-ft-red/5 dark:bg-ft-red/10'
              : items.length === 0
              ? 'border-gray-300 dark:border-gray-600'
              : 'border-transparent'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
            <svg
              className="w-12 h-12 mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-center text-sm">
              {isDragOver ? (
                <span className="text-ft-red font-medium">Slip for at tilføje</span>
              ) : (
                <>
                  Træk konti fra venstre panel
                  <br />
                  for at sammenligne
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <CompareCard
                key={`${item.node.id}`}
                node={item.node}
                color={item.color}
                onRemove={() => onRemoveItem(index)}
                previousYearNode={getPreviousYearNode(item.node)}
              />
            ))}

            {/* Tilføj flere-placeholder */}
            {items.length < COMPARE_COLORS.length && (
              <div
                className={`
                  min-h-[150px] rounded-xl border-2 border-dashed
                  flex items-center justify-center text-gray-400 dark:text-gray-500
                  transition-colors
                  ${isDragOver ? 'border-ft-red bg-ft-red/5' : 'border-gray-200 dark:border-gray-700'}
                `}
              >
                <div className="text-center">
                  <svg
                    className="w-8 h-8 mx-auto mb-1 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs">Træk flere</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
