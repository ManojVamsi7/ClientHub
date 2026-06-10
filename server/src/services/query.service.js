const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const list = async (query) => {
  const { limit, offset, sortBy, order } = parsePagination(query);
  const { status, category, client_id, date_from, date_to } = query;

  let baseQuery = db('client_queries as q')
    .leftJoin('clients as c', 'q.client_id', 'c.id')
    .leftJoin('users as u', 'q.created_by', 'u.id')
    .whereNull('q.deleted_at');

  if (status) baseQuery = baseQuery.where('q.status', status);
  if (category) baseQuery = baseQuery.where('q.category', category);
  if (client_id) baseQuery = baseQuery.where('q.client_id', client_id);
  if (date_from) baseQuery = baseQuery.where('q.created_at', '>=', date_from);
  if (date_to) baseQuery = baseQuery.where('q.created_at', '<=', date_to);

  const [{ count }] = await baseQuery.clone().count('q.id as count');
  const total = parseInt(count);

  const queries = await baseQuery
    .clone()
    .select(
      'q.*',
      'c.name as client_name',
      'c.email as client_email',
      'u.username as created_by_name'
    )
    .orderBy(`q.${sortBy}`, order)
    .limit(limit)
    .offset(offset);

  return {
    data: queries,
    pagination: buildPaginationMeta(total, limit, offset),
  };
};

const create = async (data, userId) => {
  const [query] = await db('client_queries')
    .insert({ id: uuidv4(), ...data, created_by: userId })
    .returning('*');
  return query;
};

const update = async (id, data) => {
  const [query] = await db('client_queries')
    .where('id', id)
    .whereNull('deleted_at')
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');

  if (!query) throw new NotFoundError('Query');
  return query;
};

const softDelete = async (id) => {
  const [query] = await db('client_queries')
    .where('id', id)
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() })
    .returning('*');

  if (!query) throw new NotFoundError('Query');
  return query;
};

module.exports = { list, create, update, softDelete };
