const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const list = async (query) => {
  const { limit, offset, sortBy, order } = parsePagination(query);
  const { client_id, recruiter_name, date_from, date_to, client_search } = query;

  let baseQuery = db('interview_calls as i')
    .leftJoin('clients as c', 'i.client_id', 'c.id')
    .whereNull('i.deleted_at');

  if (client_id) baseQuery = baseQuery.where('i.client_id', client_id);
  if (recruiter_name) {
    baseQuery = baseQuery.whereILike('i.recruiter_name', `%${recruiter_name}%`);
  }
  if (date_from) baseQuery = baseQuery.where('i.call_date', '>=', date_from);
  if (date_to) baseQuery = baseQuery.where('i.call_date', '<=', date_to);
  if (client_search) {
    baseQuery = baseQuery.where((builder) => {
      builder
        .whereILike('c.name', `%${client_search}%`)
        .orWhereILike('c.email', `%${client_search}%`);
    });
  }

  const [{ count }] = await baseQuery.clone().count('i.id as count');
  const total = parseInt(count);

  const allowedSortColumns = {
    call_date: 'i.call_date',
    client_name: 'c.name',
    recruiter_name: 'i.recruiter_name',
    position_applied: 'i.position_applied',
    created_at: 'i.created_at',
  };
  const sortColumn = allowedSortColumns[sortBy] || 'i.call_date';

  const interviews = await baseQuery
    .clone()
    .select(
      'i.*',
      'c.name as client_name',
      'c.email as client_email',
      'c.phone as client_phone',
      'c.student_id as client_student_id',
      'c.domain as client_domain'
    )
    .orderBy(sortColumn, order)
    .limit(limit)
    .offset(offset);

  return {
    data: interviews,
    pagination: buildPaginationMeta(total, limit, offset),
  };
};

const create = async (data) => {
  const [interview] = await db('interview_calls')
    .insert({ id: uuidv4(), ...data })
    .returning('*');
  return interview;
};

const softDelete = async (id) => {
  const [interview] = await db('interview_calls')
    .where('id', id)
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() })
    .returning('*');

  if (!interview) throw new NotFoundError('Interview');
  return interview;
};

module.exports = { list, create, softDelete };
