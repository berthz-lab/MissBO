import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  if (totalItems <= pageSizeOptions[0]) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 text-sm">
      <div className="flex items-center gap-2 text-gray-500">
        <span>{start}–{end} de {totalItems}</span>
        {onPageSizeChange && (
          <select
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
            value={pageSize}
            onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          >
            {pageSizeOptions.map(s => (
              <option key={s} value={s}>{s} por página</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1;
          if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page ? 'bg-brand-black text-white' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {p}
              </button>
            );
          }
          if (p === 2 || p === totalPages - 1) {
            return <span key={p} className="px-1 text-gray-400">…</span>;
          }
          return null;
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], defaultSize = 10) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultSize);

  // Reset page when items change significantly
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);

  const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { page: safePage, pageSize, setPage, setPageSize, paged, total: items.length };
}
