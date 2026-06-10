const queryService = require('../services/query.service');
const { success, paginated } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await queryService.list(req.query);
    paginated(res, result.data, result.pagination);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const query = await queryService.create(req.body, req.user.id);
    success(res, query, 'Query created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const query = await queryService.update(req.params.id, req.body);
    success(res, query, 'Query updated successfully');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await queryService.softDelete(req.params.id);
    success(res, null, 'Query deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };
