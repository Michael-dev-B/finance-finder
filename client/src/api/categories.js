import { get, post, put, del } from './client.js';

export const listCategories = () => get('/api/categories');
export const createCategory = (data) => post('/api/categories', data);
export const updateCategory = (id, data) => put(`/api/categories/${id}`, data);
export const deleteCategory = (id) => del(`/api/categories/${id}`);
