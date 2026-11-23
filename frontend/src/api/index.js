import { api } from './client.js'

export const auth = {
  me: () => api('/auth/me'),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  register: (body) => api('/auth/register', { method: 'POST', body }),
  logout: () => api('/auth/logout', { method: 'POST' }),
}

export const events = {
  list: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
    )
    return api(`/events?${new URLSearchParams(cleanParams)}`)
  },
  get: (id) => api(`/events/${id}`),
  create: (body) => api('/events', { method: 'POST', body }),
  update: (id, body) => api(`/events/${id}`, { method: 'PUT', body }),
  register: (id) => api(`/events/${id}/register`, { method: 'POST' }),
  cancel: (id) => api(`/events/${id}/register`, { method: 'DELETE' }),
  delete: (id) => api(`/events/${id}`, { method: 'DELETE' }),
  mine: () => api('/events/mine'),
  attendees: (id) => api(`/events/${id}/attendees`),
}

export const categories = {
  list: () => api('/categories'),
  create: (body) => api('/categories', { method: 'POST', body }),
  update: (id, body) => api(`/categories/${id}`, { method: 'PUT', body }),
  delete: (id) => api(`/categories/${id}`, { method: 'DELETE' }),
}

export const venues = {
  list: () => api('/venues'),
  create: (body) => api('/venues', { method: 'POST', body }),
  update: (id, body) => api(`/venues/${id}`, { method: 'PUT', body }),
  delete: (id) => api(`/venues/${id}`, { method: 'DELETE' }),
}

export const registrations = {
  mine: () => api('/registrations/me'),
}