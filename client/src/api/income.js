import { get } from './client.js';

export const getIncomeSummary = (from, to) => get(`/api/income/summary?from=${from}&to=${to}`);
