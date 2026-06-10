import api from './api';

export const getClients = (params) => api.get('/api/clients', { params });
export const getClient = (id) => api.get(`/api/clients/${id}`);
export const createClient = (data) => api.post('/api/clients', data);
export const updateClient = (id, data) => api.put(`/api/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/api/clients/${id}`);
export const bulkDeleteClients = (ids) => api.post('/api/clients/bulk-delete', { ids });
export const importClients = (clients) => api.post('/api/clients/import', { clients });
export const getDomains = () => api.get('/api/clients/domains');
