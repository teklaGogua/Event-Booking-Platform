// Turns "2026-12-14T19:00:00.000Z" into "Mon, 14 Dec 2026, 19:00"
export function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// True if the event date is already in the past
export const isPast = (iso) => new Date(iso).getTime() < Date.now()