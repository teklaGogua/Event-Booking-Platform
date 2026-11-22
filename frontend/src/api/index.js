import { api } from './client.js'

export const auth = {
  me: () => api('/auth/me'),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  register: (body) => api('/auth/register', { method: 'POST', body }),
  logout: () => api('/auth/logout', { method: 'POST' }),
}

export const events = {
  list: (params = {}) => api(`/events?${new URLSearchParams(params)}`),
  get: (id) => api(`/events/${id}`),
  register: (id) => api(`/events/${id}/register`, { method: 'POST' }),
  cancel: (id) => api(`/events/${id}/register`, { method: 'DELETE' }),
}

export const categories = { list: () => api('/categories') }
export const registrations = { mine: () => api('/registrations/me') }