import api from './api';

export const getStats = () => api.get('/api/dashboard/stats');
export const getRecentActivity = () => api.get('/api/dashboard/recent-activity');
export const getInterviewTimeline = () => api.get('/api/dashboard/interview-timeline');
export const getRecruiterPerformance = () => api.get('/api/dashboard/reports/recruiter-performance');
export const getQueryStatusBreakdown = () => api.get('/api/dashboard/reports/query-status');
export const getDomainInterviews = () => api.get('/api/dashboard/reports/domain-interviews');
