/* eslint-disable @typescript-eslint/no-explicit-any */
export type RecordData = Record<string, any>
// Deployment variables are commonly entered as "https://host/api/".  Keep
// endpoint construction stable for both that form and the local Vite proxy.
export const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
// OAuth begins with a browser redirect and relies on Django's session cookie.
// In local Vite development the proxy host is `localhost:5173`, while GitHub
// returns to `127.0.0.1:8000`; starting directly on the backend keeps that
// cookie on the same host as the callback.
export const OAUTH_API = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '')
export async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const token = localStorage.getItem('access')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || Object.values(data).flat().join(' ') || 'Ошибка запроса')
  return data
}
export const go = (path: string) => { window.location.hash = path }
export const routeParts = () => window.location.hash.slice(1).split('/').filter(Boolean)

