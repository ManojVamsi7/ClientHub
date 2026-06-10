import api from './api';

export const getStudents = (params) => api.get('/api/students', { params });
export const importStudents = (students) => api.post('/api/students/import', { students });
