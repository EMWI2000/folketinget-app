import { useMemo, useState } from 'react'
import type { BudgetNode, FinanslovData } from '../../lib/finanslov/types'
import { formatBudgetCompact } from '../../lib/finanslov/formatter'

interface TreemapProps {
  data: FinanslovData | undefined
  onSelectNode?: (node: BudgetNode) => void
}

// Farver for paragraf-kategorier
const CATEGORY_COLORS = [
  '#a1172f', '#dc2626', '#ea580c', '#d97706', '#ca8a04',
  '#65a30d', '#16a34a', '#059669', '#0d9488', '#0891b2',
  '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea',
  '#c026d3', '#db2777', '#e11d48',
]

interface TreemapRect {
  node: BudgetNode
  x: number
  y: number
  width: number
  height: number
  color: string
}

/** Simpel treemap-layout algoritme (squarified-lignende) */
function layoutTreemap(
  nodes: BudgetNode[],
  x: number,
  y: number,
  width: number,
  height: number
): TreemapRect[] {
  // Filtrer til kun positive værdier (udgifter)
  const positiveNodes = nodes.filter((n) => n.values.F > 0)
  if (positiveNodes.length === 0) return []

  const total = positiveNodes.reduce((sum, n) => sum + n.values.F, 0)
  if (total === 0) return []

  const rects: TreemapRect[] = []
  let currentX = x
  let currentY = y
  let remainingWidth = width
  let remainingHeight = height
  let vertical = width < height

  // Sortér efter størrelse (største først)
  const sorted = [...positiveNodes].sort((a, b) => b.values.F - a.values.F)

  sorted.forEach((node, index) => {
    const ratio = node.values.F / total
    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]

    if (vertical) {
      const h = remainingHeight * ratio * (positiveNodes.length / (positiveNodes.length - index))
      rects.push({
        node,
        x: currentX,
        y: currentY,
        width: remainingWidth,
        height: Math.min(h, remainingHeight),
        color,
      })
      currentY += h
      remainingHeight -= h
    } else {
      const w = remainingWidth * ratio * (positiveNodes.length / (positiveNodes.length - index))
      rects.push({
        node,
        x: currentX,
        y: currentY,
        width: Math.min(w, remainingWidth),
        height: remainingHeight,
        color,
      })
      currentX += w
      remainingWidth -= w
    }

    // Skift retning efter hver
    vertical = !vertical
  })

  return rects
}

export default function Treemap({ data, onSelectNode }: TreemapProps) {
  const [hoveredNode, setHoveredNode] = useState<BudgetNode | null>(null)

  // Beregn treemap-layout
  const rects = useMemo(() => {
    if (!data) return []

    // Brug paragraf-niveau (ministerier)
    const paragraphs = data.tree.filter((n) => n.level === 'paragraf')
    return layoutTreemap(paragraphs, 0, 0, 400, 250)
  }, [data])

  if (!data || rects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Budget fordelt på ministerier
        </h4>
        <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          Indlæser data...
        </div>
      </div>
    )
  }

  const total = rects.reduce((sum, r) => sum + r.node.values.F, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Budget fordelt på ministerier
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Total: {formatBudgetCompact(total)}
        </span>
      </div>

      <div className="relative">
        <svg width="100%" viewBox="0 0 400 250" className="rounded-lg overflow-hidden">
          {rects.map((rect) => {
            const isHovered = hoveredNode?.code === rect.node.code

            return (
              <g key={rect.node.code}>
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={rect.color}
                  stroke="white"
                  strokeWidth={2}
                  className={`cursor-pointer transition-opacity ${
                    isHovered ? 'opacity-80' : 'opacity-100'
                  }`}
                  onMouseEnter={() => setHoveredNode(rect.node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onSelectNode?.(rect.node)}
                />

                {/* Label (kun hvis stort nok) */}
                {rect.width > 50 && rect.height > 30 && (
                  <text
                    x={rect.x + rect.width / 2}
                    y={rect.y + rect.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-[9px] font-medium pointer-events-none"
                  >
                    <tspan x={rect.x + rect.width / 2} dy="-0.3em">
                      § {rect.node.code}
                    </tspan>
                    {rect.width > 80 && rect.height > 40 && (
                      <tspan x={rect.x + rect.width / 2} dy="1.2em" className="opacity-80">
                        {formatBudgetCompact(rect.node.values.F)}
                      </tspan>
                    )}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredNode && (
          <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-[200px]">
            <div className="font-medium">§ {hoveredNode.code}</div>
            <div className="text-gray-300 truncate">{hoveredNode.name}</div>
            <div className="text-gray-100 font-medium mt-1">
              {formatBudgetCompact(hoveredNode.values.F)}
            </div>
            <div className="text-gray-400 text-[10px] mt-1">
              {((hoveredNode.values.F / total) * 100).toFixed(1)}% af total
            </div>
          </div>
        )}
      </div>

      {/* Mini-legend */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Klik på en boks for at tilføje til sammenligning
      </div>
    </div>
  )
}
