import { useState, useCallback } from 'react';
import type { PaginationMeta } from '@/types';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination({ initialPage = 1, initialLimit = 10 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const goToPage = useCallback((p: number) => setPage(p), []);
  const nextPage = useCallback(() => setPage((p) => (meta && p < meta.total_pages ? p + 1 : p)), [meta]);
  const prevPage = useCallback(() => setPage((p) => (p > 1 ? p - 1 : p)), []);

  const changeLimit = useCallback((l: number) => {
    setLimit(l);
    setPage(1);
  }, []);

  const updateMeta = useCallback((m: PaginationMeta) => setMeta(m), []);

  return {
    page,
    limit,
    meta,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    updateMeta,
    /** Query string params ready to spread into API calls */
    params: { page: String(page), limit: String(limit) },
  };
}
