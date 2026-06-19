import { get, post, put, del } from './client.js';

export const listRecurring   = ()          => get('/api/recurring');
export const createRecurring = (data)      => post('/api/recurring', data);
export const updateRecurring = (id, data)  => put(`/api/recurring/${id}`, data);
export const deleteRecurring = (id)        => del(`/api/recurring/${id}`);
export const getUpcoming     = (from, to)  => get(`/api/recurring/upcoming?from=${from}&to=${to}`);
