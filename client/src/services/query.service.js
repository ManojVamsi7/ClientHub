import api from './api';

export const getQueries = (params) => api.get('/api/queries', { params });
export const createQuery = (data) => api.post('/api/queries', data);
export const updateQuery = (id, data) => api.put(`/api/queries/${id}`, data);
export const deleteQuery = (id) => api.delete(`/api/queries/${id}`);
