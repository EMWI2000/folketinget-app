import { useState, useCallback } from 'react'
import type { BudgetNode, HierarchyLevel } from '../../lib/finanslov/types'
import { formatBudgetCompact } from '../../lib/finanslov/formatter'

interface BudgetTreeNodeProps {
  node: BudgetNode
  depth: number
  expandedNodes: Set<string>
  onToggle: (code: string) => void
  onDragStart: (node: BudgetNode) => void
  searchTerm?: string
}

/** Farver per niveau */
const LEVEL_COLORS: Record<HierarchyLevel, string> = {
  paragraf: 'text-ft-red dark:text-ft-red-light font-bold',
  hovedomraade: 'text-blue-700 dark:text-blue-400 font-semibold',
  aktivitetsomraade: 'text-emerald-700 dark:text-emerald-400',
  hovedkonto: 'text-amber-700 dark:text-amber-400',
  underkonto: 'text-purple-700 dark:text-purple-400',
  standardkonto: 'text-gray-500 dark:text-gray-400 text-sm',
}

/** Highlighte søgeterm i tekst */
function highlightText(text: string, searchTerm: string) {
  if (!searchTerm || searchTerm.length < 2) return text

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function BudgetTreeNode({
  node,
  depth,
  expandedNodes,
  onToggle,
  onDragStart,
  searchTerm = '',
}: BudgetTreeNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const isExpanded = expandedNodes.has(node.code)
  const hasChildren = node.children.length > 0

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (hasChildren) {
        onToggle(node.code)
      }
    },
    [hasChildren, node.code, onToggle]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true)
      e.dataTransfer.setData('application/json', JSON.stringify(node))
      e.dataTransfer.effectAllowed = 'copy'
      onDragStart(node)
    },
    [node, onDragStart]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const paddingLeft = depth * 16 + 8

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-colors group
          ${isDragging ? 'opacity-50' : ''}
        `}
        style={{ paddingLeft }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleToggle}
      >
        {/* Expand/collapse chevron */}
        <button
          className={`
            w-5 h-5 flex items-center justify-center
            text-gray-400 dark:text-gray-500
            ${!hasChildren ? 'invisible' : ''}
          `}
          onClick={handleToggle}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Drag handle */}
        <div className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>

        {/* Kode */}
        <span className={`font-mono text-xs ${LEVEL_COLORS[node.level]}`}>
          {highlightText(node.code, searchTerm)}
        </span>

        {/* Navn */}
        <span className={`flex-1 truncate ${LEVEL_COLORS[node.level]}`}>
          {highlightText(node.name, searchTerm)}
        </span>

        {/* F-værdi (bevilling) */}
        <span
          className={`
            text-xs tabular-nums
            ${node.values.F < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}
          `}
        >
          {formatBudgetCompact(node.values.F)}
        </span>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <BudgetTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onDragStart={onDragStart}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  )
}
