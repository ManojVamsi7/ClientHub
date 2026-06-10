import api from './api';

export const getMistakes = (params) => api.get('/api/mistakes', { params });
export const createMistake = (data) => api.post('/api/mistakes', data);
export const updateMistake = (id, data) => api.put(`/api/mistakes/${id}`, data);
export const deleteMistake = (id) => api.delete(`/api/mistakes/${id}`);
