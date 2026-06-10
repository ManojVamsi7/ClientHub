import { useState, useCallback } from 'react';

export const usePagination = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const setPaginationData = useCallback((metadata) => {
    if (metadata) {
      setPage(metadata.page || 1);
      setLimit(metadata.limit || initialLimit);
      setTotal(metadata.total || 0);
    }
  }, [initialLimit]);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  const totalPages = Math.ceil(total / limit) || 1;

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setTotal,
    setPaginationData,
    nextPage,
    prevPage,
    reset,
  };
};
