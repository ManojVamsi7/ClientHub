const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');

const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    success(res, stats);
  } catch (err) {
    next(err);
  }
};

const getRecruiterPerformance = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecruiterPerformance();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getQueryStatus = async (req, res, next) => {
  try {
    const data = await dashboardService.getQueryStatusBreakdown();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getInterviewTimeline = async (req, res, next) => {
  try {
    const data = await dashboardService.getInterviewTimeline();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentActivity();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getDomainInterviews = async (req, res, next) => {
  try {
    const data = await dashboardService.getDomainInterviews();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getRecruiterPerformance,
  getQueryStatus,
  getInterviewTimeline,
  getRecentActivity,
  getDomainInterviews,
};
