import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton, EmptyState } from './States';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface PaginationInfo {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  keyExtractor: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: PaginationInfo;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  keyExtractor,
  emptyTitle = 'No records found',
  emptyDescription,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium text-navy-500 ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          {!isLoading && data.length > 0 && (
            <tbody className="divide-y divide-navy-100">
              {data.map((row) => (
                <tr key={keyExtractor(row)} className="hover:bg-navy-50/40">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 align-middle text-ink ${col.className ?? ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
        {isLoading && <TableSkeleton cols={columns.length} />}
        {!isLoading && data.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} />}
      </div>
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm text-navy-500">
          <span>
            Page {pagination.page} of {pagination.pages} &middot; {pagination.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary px-2.5 py-1.5"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="btn-secondary px-2.5 py-1.5"
              disabled={pagination.page >= pagination.pages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
