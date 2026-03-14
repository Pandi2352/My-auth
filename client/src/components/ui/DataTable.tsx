import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Spinner } from './Spinner';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import type { PaginationMeta } from '@/types';

// ── Column definition ──────────────────────────────────────
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

// ── Sort state ─────────────────────────────────────────────
export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

// ── Props ──────────────────────────────────────────────────
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  /** Unique key accessor — defaults to `_id` */
  rowKey?: (row: T) => string;

  // Sorting
  sort?: SortState | null;
  onSort?: (sort: SortState) => void;

  // Server-side pagination
  meta?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;

  /** Enable client-side pagination when no server meta is provided. Default: 10 */
  pageSize?: number;
}

const limitOptions = [10, 20, 50, 100];

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found.',
  emptyIcon,
  emptyAction,
  rowKey = (row: any) => row._id ?? row.id ?? Math.random().toString(),
  sort,
  onSort,
  meta,
  onPageChange,
  onLimitChange,
  pageSize = 10,
}: DataTableProps<T>) {
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  // Client-side pagination state (used when no server meta)
  const [clientPage, setClientPage] = useState(1);
  const [clientLimit, setClientLimit] = useState(pageSize);

  const useServerPagination = !!meta;

  // Client-side paginated data
  const { paginatedData, clientMeta } = useMemo(() => {
    if (useServerPagination || isLoading || !data || data.length === 0) {
      return { paginatedData: data, clientMeta: null };
    }

    const total = data.length;
    const totalPages = Math.ceil(total / clientLimit);
    const safePage = Math.min(clientPage, totalPages || 1);
    const start = (safePage - 1) * clientLimit;
    const sliced = data.slice(start, start + clientLimit);

    return {
      paginatedData: sliced,
      clientMeta:
        total > clientLimit
          ? { page: safePage, limit: clientLimit, total, total_pages: totalPages }
          : null,
    };
  }, [data, clientPage, clientLimit, useServerPagination, isLoading]);

  const handleSort = (key: string) => {
    if (!onSort) return;
    if (sort?.key === key) {
      onSort({ key, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ key, direction: 'asc' });
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sort?.key === colKey) {
      return sort.direction === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      );
    }
    return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  };

  const displayData = useServerPagination ? data : paginatedData;
  const activeMeta = useServerPagination ? meta : clientMeta;

  const handlePageChange = (page: number) => {
    if (useServerPagination) {
      onPageChange?.(page);
    } else {
      setClientPage(page);
    }
  };

  const handleLimitChange = (limit: number) => {
    if (useServerPagination) {
      onLimitChange?.(limit);
    } else {
      setClientLimit(limit);
      setClientPage(1);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                    col.className,
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                  onMouseEnter={() => col.sortable && setHoveredCol(col.key)}
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (hoveredCol === col.key || sort?.key === col.key) && (
                      <SortIcon colKey={col.key} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Spinner size="md" className="mx-auto" />
                </td>
              </tr>
            ) : !displayData || displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      {emptyIcon || <Inbox className="h-6 w-6 text-muted-foreground/50" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
                    </div>
                    {emptyAction && <div className="mt-1">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              displayData.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="transition-colors hover:bg-muted/30"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {activeMeta && activeMeta.total_pages > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <select
              value={activeMeta.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded border border-border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Page {activeMeta.page} of {activeMeta.total_pages} ({activeMeta.total} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(activeMeta.page - 1)}
                disabled={activeMeta.page <= 1}
                className="rounded p-1 hover:bg-accent disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(activeMeta.page + 1)}
                disabled={activeMeta.page >= activeMeta.total_pages}
                className="rounded p-1 hover:bg-accent disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
