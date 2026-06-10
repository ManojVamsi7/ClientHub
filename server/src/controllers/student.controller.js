const studentService = require('../services/student.service');
const { success } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const students = await studentService.list(req.query);
    success(res, students);
  } catch (err) {
    next(err);
  }
};

const bulkImport = async (req, res, next) => {
  try {
    const results = await studentService.bulkImport(req.body.students);
    success(res, results, 'Students imported successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, bulkImport };
