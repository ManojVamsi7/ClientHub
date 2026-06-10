/**
 * Pagination helper - parses query params and builds pagination metadata
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePagination = (query) => {
  let limit = parseInt(query.limit) || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (limit < 1) limit = DEFAULT_LIMIT;

  let offset = parseInt(query.offset) || 0;
  if (offset < 0) offset = 0;

  const sortBy = query.sort_by || 'created_at';
  const order = query.order === 'asc' ? 'asc' : 'desc';

  return { limit, offset, sortBy, order };
};

const buildPaginationMeta = (total, limit, offset) => {
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return {
    total,
    page,
    pages,
    limit,
    offset,
    hasNext: offset + limit < total,
    hasPrev: offset > 0,
  };
};

module.exports = { parsePagination, buildPaginationMeta };
