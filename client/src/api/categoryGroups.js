import { get, post, put, del } from './client.js';

export const listCategoryGroups = () => get('/api/category-groups');
export const createCategoryGroup = (data) => post('/api/category-groups', data);
export const updateCategoryGroup = (id, data) => put(`/api/category-groups/${id}`, data);
export const deleteCategoryGroup = (id) => del(`/api/category-groups/${id}`);
