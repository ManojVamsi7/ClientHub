const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const list = async (query) => {
  const { limit, offset, sortBy, order } = parsePagination(query);
  const { search, status, domain, interview_status } = query;

  let baseQuery = db('clients').whereNull('deleted_at');

  if (search) {
    baseQuery = baseQuery.where((builder) => {
      builder
        .whereILike('name', `%${search}%`)
        .orWhereILike('email', `%${search}%`)
        .orWhereILike('student_id', `%${search}%`);
    });
  }

  if (status) {
    baseQuery = baseQuery.where('status', status);
  }

  if (domain) {
    baseQuery = baseQuery.whereILike('domain', `%${domain}%`);
  }

  if (interview_status === 'scheduled') {
    baseQuery = baseQuery.whereExists(function () {
      this.select('*')
        .from('interview_calls')
        .whereRaw('interview_calls.client_id = clients.id')
        .whereNull('interview_calls.deleted_at');
    });
  } else if (interview_status === 'pending') {
    baseQuery = baseQuery.whereNotExists(function () {
      this.select('*')
        .from('interview_calls')
        .whereRaw('interview_calls.client_id = clients.id')
        .whereNull('interview_calls.deleted_at');
    });
  }

  // Get total count
  const [{ count }] = await baseQuery.clone().count('id as count');
  const total = parseInt(count);

  // Get paginated data
  const clients = await baseQuery
    .select('*')
    .orderBy(sortBy, order)
    .limit(limit)
    .offset(offset);

  return {
    data: clients,
    pagination: buildPaginationMeta(total, limit, offset),
  };
};

// Get all unique domains for the filter dropdown
const getDomains = async () => {
  const domains = await db('clients')
    .whereNull('deleted_at')
    .whereNotNull('domain')
    .where('domain', '!=', '')
    .distinct('domain')
    .orderBy('domain', 'asc');
  return domains.map((d) => d.domain);
};

const getById = async (id) => {
  const client = await db('clients')
    .where('id', id)
    .whereNull('deleted_at')
    .first();

  if (!client) {
    throw new NotFoundError('Client');
  }

  // Fetch related data
  const [queries, interviews] = await Promise.all([
    db('client_queries')
      .where('client_id', id)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(50),
    db('interview_calls')
      .select('*')
      .where('client_id', id)
      .whereNull('deleted_at')
      .orderBy('call_date', 'desc')
      .limit(50),
  ]);

  return {
    ...client,
    queries,
    interviews,
  };
};

const create = async (data) => {
  const [client] = await db('clients')
    .insert({ id: uuidv4(), ...data })
    .returning('*');
  return client;
};

const update = async (id, data) => {
  const [client] = await db('clients')
    .where('id', id)
    .whereNull('deleted_at')
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');

  if (!client) {
    throw new NotFoundError('Client');
  }

  return client;
};

const softDelete = async (id) => {
  const [client] = await db('clients')
    .where('id', id)
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() })
    .returning('*');

  if (!client) {
    throw new NotFoundError('Client');
  }

  return client;
};

const bulkImport = async (clientsList) => {
  if (!Array.isArray(clientsList)) {
    throw new Error('Clients list must be an array');
  }

  const results = {
    inserted: 0,
    updated: 0,
    errors: [],
  };

  await db.transaction(async (trx) => {
    for (const clientData of clientsList) {
      try {
        const { name, email, phone, status, student_id, domain } = clientData;
        if (!name || !name.trim()) {
          results.errors.push(`Missing name for entry: ${JSON.stringify(clientData)}`);
          continue;
        }

        // Check by student_id first (if provided), then by name
        let existing = null;
        if (student_id && student_id.trim()) {
          existing = await trx('clients')
            .whereRaw('LOWER(student_id) = ?', [student_id.trim().toLowerCase()])
            .whereNull('deleted_at')
            .first();
        }
        if (!existing) {
          existing = await trx('clients')
            .whereRaw('LOWER(name) = ?', [name.trim().toLowerCase()])
            .whereNull('deleted_at')
            .first();
        }

        if (existing) {
          await trx('clients')
            .where('id', existing.id)
            .update({
              name: name.trim(),
              email: email || existing.email,
              phone: phone || existing.phone,
              status: status || existing.status,
              student_id: student_id ? student_id.trim() : existing.student_id,
              domain: domain ? domain.trim() : existing.domain,
              updated_at: trx.fn.now(),
            });
          results.updated++;
        } else {
          await trx('clients').insert({
            id: uuidv4(),
            name: name.trim(),
            email: email || null,
            phone: phone || null,
            status: status || 'active',
            student_id: student_id ? student_id.trim() : null,
            domain: domain ? domain.trim() : null,
          });
          results.inserted++;
        }
      } catch (err) {
        results.errors.push(`Error importing client "${clientData.name}": ${err.message}`);
      }
    }
  });

  return results;
};

const bulkSoftDelete = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('IDs list must be a non-empty array');
  }

  return await db('clients')
    .whereIn('id', ids)
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() });
};

module.exports = { list, getById, create, update, softDelete, bulkSoftDelete, bulkImport, getDomains };
