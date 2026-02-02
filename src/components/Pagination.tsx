interface PaginationProps {
  page: number
  totalCount?: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalCount, pageSize, onPageChange }: PaginationProps) {
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : undefined

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Forrige
      </button>
      <span className="text-sm text-gray-500">
        Side {page}
        {totalPages !== undefined && ` af ${totalPages}`}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={totalPages !== undefined && page >= totalPages}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Næste
      </button>
    </div>
  )
}
