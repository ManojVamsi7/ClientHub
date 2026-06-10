import api from './api';

export const getInterviews = (params) => api.get('/api/interviews', { params });
export const createInterview = (data) => api.post('/api/interviews', data);
export const deleteInterview = (id) => api.delete(`/api/interviews/${id}`);
