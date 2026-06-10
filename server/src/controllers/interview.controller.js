const interviewService = require('../services/interview.service');
const { success, paginated } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await interviewService.list(req.query);
    paginated(res, result.data, result.pagination);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const interview = await interviewService.create(req.body);
    success(res, interview, 'Interview logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await interviewService.softDelete(req.params.id);
    success(res, null, 'Interview deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, remove };
