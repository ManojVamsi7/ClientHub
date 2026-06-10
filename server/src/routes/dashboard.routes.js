const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');

// Dashboard stats
router.get('/stats', dashboardController.getStats);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/interview-timeline', dashboardController.getInterviewTimeline);

// Reports
router.get('/reports/recruiter-performance', dashboardController.getRecruiterPerformance);
router.get('/reports/query-status', dashboardController.getQueryStatus);

module.exports = router;
