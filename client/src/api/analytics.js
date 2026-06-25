import { get } from './client.js';

export const getAnalyticsTrends     = (from, to)       => get(`/api/analytics/trends?from=${from}&to=${to}`);
export const getAnalyticsByCategory = (from, to, type) => get(`/api/analytics/by-category?from=${from}&to=${to}&type=${type}`);
export const getAnalyticsByTag      = (from, to)       => get(`/api/analytics/by-tag?from=${from}&to=${to}`);
export const getNetWorthTrend       = ()               => get('/api/analytics/net-worth-trend');
