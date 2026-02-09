import { useState, useCallback, useMemo } from 'react'
import type { BudgetNode, HierarchyLevel } from '../../lib/finanslov/types'
import { LEVEL_LABELS } from '../../lib/finanslov/types'
import BudgetTreeNode from './BudgetTreeNode'

interface BudgetTreeProps {
  tree: BudgetNode[]
  onDragStart: (node: BudgetNode) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  levelFilter: HierarchyLevel | null
  onLevelFilterChange: (level: HierarchyLevel | null) => void
}

export default function BudgetTree({
  tree,
  onDragStart,
  searchTerm,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
}: BudgetTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Start med paragraffer synlige
    return new Set<string>()
  })

  const handleToggle = useCallback((code: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }, [])

  // Expand alle noder der matcher søgningen
  const effectiveExpanded = useMemo(() => {
    if (searchTerm.length < 2) return expandedNodes

    // Når der søges, expand alle noder der har matches som børn
    const toExpand = new Set(expandedNodes)
    for (const node of tree) {
      function checkAndExpand(n: BudgetNode): boolean {
        const nameMatches = n.name.toLowerCase().includes(searchTerm.toLowerCase())
        const codeMatches = n.code.toLowerCase().includes(searchTerm.toLowerCase())

        let hasMatchingChild = false
        for (const child of n.children) {
          if (checkAndExpand(child)) {
            hasMatchingChild = true
          }
        }

        if (hasMatchingChild || nameMatches || codeMatches) {
          if (n.children.length > 0) {
            toExpand.add(n.code)
          }
          return true
        }
        return false
      }
      checkAndExpand(node)
    }
    return toExpand
  }, [searchTerm, expandedNodes, tree])

  // Filtrer træet på niveau hvis valgt
  const filteredTree = useMemo(() => {
    if (!levelFilter) return tree

    function filterByLevel(nodes: BudgetNode[]): BudgetNode[] {
      const result: BudgetNode[] = []
      for (const node of nodes) {
        if (node.level === levelFilter) {
          result.push({ ...node, children: [] }) // Stop ved valgt niveau
        } else {
          const filteredChildren = filterByLevel(node.children)
          if (filteredChildren.length > 0 || node.level === levelFilter) {
            result.push({ ...node, children: filteredChildren })
          }
        }
      }
      return result
    }

    return filterByLevel(tree)
  }, [tree, levelFilter])

  // Expand/collapse alle
  const expandAll = useCallback(() => {
    const allCodes = new Set<string>()
    function collectCodes(nodes: BudgetNode[]) {
      for (const node of nodes) {
        if (node.children.length > 0) {
          allCodes.add(node.code)
          collectCodes(node.children)
        }
      }
    }
    collectCodes(tree)
    setExpandedNodes(allCodes)
  }, [tree])

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Søgefelt */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Søg konto..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ft-red focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Niveau-filter og expand/collapse */}
        <div className="flex items-center gap-2 mt-2">
          <select
            value={levelFilter ?? ''}
            onChange={(e) =>
              onLevelFilterChange(e.target.value ? (e.target.value as HierarchyLevel) : null)
            }
            className="flex-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5"
          >
            <option value="">Alle niveauer</option>
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            onClick={expandAll}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Udvid alle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
              />
            </svg>
          </button>

          <button
            onClick={collapseAll}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Fold alle sammen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Trævisning */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            {searchTerm.length >= 2
              ? 'Ingen resultater fundet'
              : 'Indlæser finanslovsdata...'}
          </div>
        ) : (
          filteredTree.map((node) => (
            <BudgetTreeNode
              key={node.id}
              node={node}
              depth={0}
              expandedNodes={effectiveExpanded}
              onToggle={handleToggle}
              onDragStart={onDragStart}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>

      {/* Info */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Træk en konto til højre panel for at sammenligne
      </div>
    </div>
  )
}
