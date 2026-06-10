const mistakeService = require('../services/mistake.service');
const { success, paginated } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await mistakeService.list(req.query);
    paginated(res, result.data, result.pagination);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const mistake = await mistakeService.create(req.body, req.user.id);
    success(res, mistake, 'Mistake logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const mistake = await mistakeService.update(req.params.id, req.body);
    success(res, mistake, 'Mistake updated successfully');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await mistakeService.softDelete(req.params.id);
    success(res, null, 'Mistake deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };
