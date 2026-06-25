import { get, post, put, del } from './client.js';

export const listTags = () => get('/api/tags');
export const createTag = (data) => post('/api/tags', data);
export const updateTag = (id, data) => put(`/api/tags/${id}`, data);
export const deleteTag = (id) => del(`/api/tags/${id}`);
