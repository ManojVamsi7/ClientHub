const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const list = async (query) => {
  const { limit, offset, sortBy, order } = parsePagination(query);
  const { recruiter_name, severity, date_from, date_to } = query;

  let baseQuery = db('recruiter_mistakes as m')
    .leftJoin('users as u', 'm.created_by', 'u.id')
    .whereNull('m.deleted_at');

  if (recruiter_name) {
    baseQuery = baseQuery.whereILike('m.recruiter_name', `%${recruiter_name}%`);
  }
  if (severity) baseQuery = baseQuery.where('m.severity', severity);
  if (date_from) baseQuery = baseQuery.where('m.created_at', '>=', date_from);
  if (date_to) baseQuery = baseQuery.where('m.created_at', '<=', date_to);

  const [{ count }] = await baseQuery.clone().count('m.id as count');
  const total = parseInt(count);

  const mistakes = await baseQuery
    .clone()
    .select('m.*', 'u.username as created_by_name')
    .orderBy(`m.${sortBy}`, order)
    .limit(limit)
    .offset(offset);

  return {
    data: mistakes,
    pagination: buildPaginationMeta(total, limit, offset),
  };
};

const create = async (data, userId) => {
  const [mistake] = await db('recruiter_mistakes')
    .insert({ id: uuidv4(), ...data, created_by: userId })
    .returning('*');
  return mistake;
};

const update = async (id, data) => {
  const [mistake] = await db('recruiter_mistakes')
    .where('id', id)
    .whereNull('deleted_at')
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');

  if (!mistake) throw new NotFoundError('Mistake');
  return mistake;
};

const softDelete = async (id) => {
  const [mistake] = await db('recruiter_mistakes')
    .where('id', id)
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() })
    .returning('*');

  if (!mistake) throw new NotFoundError('Mistake');
  return mistake;
};

module.exports = { list, create, update, softDelete };
