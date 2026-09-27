export type RecordData = Record<string, any>
export const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
export const OAUTH_API = API
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

