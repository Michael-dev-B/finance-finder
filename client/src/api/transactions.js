import { get, post, put, del } from './client.js';

export const listTransactions = (month) =>
  get('/api/transactions' + (month ? `?month=${month}` : ''));
export const createTransaction = (data) => post('/api/transactions', data);
export const updateTransaction = (id, data) => put(`/api/transactions/${id}`, data);
export const deleteTransaction = (id) => del(`/api/transactions/${id}`);
