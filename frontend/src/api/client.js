export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details || []
  }
}

// One place for every request to the backend.
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.error || 'Something went wrong', data?.details)
  return data
}