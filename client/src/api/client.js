const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), {
      status: res.status,
      data,
    });
  }
  return data;
}

export const get = (path) => request('GET', path);
export const post = (path, body) => request('POST', path, body);
export const put = (path, body) => request('PUT', path, body);
export const del = (path) => request('DELETE', path);
