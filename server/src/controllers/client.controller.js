const clientService = require('../services/client.service');
const { success, paginated } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await clientService.list(req.query);
    paginated(res, result.data, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const client = await clientService.getById(req.params.id);
    success(res, client);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const client = await clientService.create(req.body);
    success(res, client, 'Client created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const client = await clientService.update(req.params.id, req.body);
    success(res, client, 'Client updated successfully');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await clientService.softDelete(req.params.id);
    success(res, null, 'Client deleted successfully');
  } catch (err) {
    next(err);
  }
};

const bulkRemove = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No client IDs provided' });
    }
    await clientService.bulkSoftDelete(ids);
    success(res, null, `${ids.length} clients deleted successfully`);
  } catch (err) {
    next(err);
  }
};

const bulkImport = async (req, res, next) => {
  try {
    const results = await clientService.bulkImport(req.body.clients);
    success(res, results, 'Clients imported successfully');
  } catch (err) {
    next(err);
  }
};

const getDomains = async (req, res, next) => {
  try {
    const domains = await clientService.getDomains();
    success(res, domains);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove, bulkRemove, bulkImport, getDomains };
