import { API_URL } from '../../config/env'

export async function authenticate(mode, form) {
  const response = await fetch(`${API_URL}/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : { message: `Server returned ${response.status} instead of JSON. Check VITE_API_URL and the Render service root directory.` }
  if (!response.ok) throw new Error(data.message || 'Something went wrong.')
  return data
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error('Session expired')
  return response.json()
}
