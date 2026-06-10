const router = require('express').Router();
const studentController = require('../controllers/student.controller');
const authorize = require('../middleware/authorize');

router.get('/', studentController.list);
router.post('/import', authorize('admin', 'recruiter'), studentController.bulkImport);

module.exports = router;
