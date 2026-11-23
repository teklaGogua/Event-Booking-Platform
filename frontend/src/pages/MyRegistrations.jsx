import { useEffect, useState } from 'react'
import { registrations as registrationsApi, events as eventsApi } from '../api/index.js'
import { formatDate } from '../lib/format.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [cancelBusy, setCancelBusy] = useState(false)

  // Load my bookings
  const loadRegistrations = async () => {
    try {
      setStatus('loading')
      const data = await registrationsApi.mine()
      setRegistrations(data.data)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    loadRegistrations()
  }, [])

  // Cancel a booking
  const handleCancel = async () => {
    if (!selectedRegistration) return

    try {
      setCancelBusy(true)
      await eventsApi.cancel(selectedRegistration.event_id)

      setSelectedRegistration(null)
      await loadRegistrations()
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelBusy(false)
    }
  }

  return (
    <div>
      <h1>My bookings</h1>

      {status === 'loading' && <p>Loading your bookings…</p>}

      {status === 'error' && (
        <p role="alert">{error || 'Could not load your bookings.'}</p>
      )}

      {status === 'ready' && registrations.length === 0 && (
        <p>You haven't booked any events yet.</p>
      )}

      {status === 'ready' && registrations.length > 0 && (
        <div>
          {registrations.map((registration) => (
            <article key={registration.id}>
              <h2>{registration.title}</h2>

              <p>{formatDate(registration.event_date)}</p>

              <p>
                {registration.venue_name}, {registration.venue_city}
              </p>

              <p>
                Status:{' '}
                {registration.status === 'registered'
                  ? 'Registered'
                  : 'Cancelled'}
              </p>

              {registration.status === 'registered' && (
                <button
                  onClick={() => setSelectedRegistration(registration)}
                >
                  Cancel booking
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {selectedRegistration && (
        <ConfirmDialog
          title="Cancel booking?"
          message={`Are you sure you want to cancel your booking for "${selectedRegistration.title}"?`}
          confirmLabel="Cancel booking"
          busy={cancelBusy}
          onConfirm={handleCancel}
          onCancel={() => setSelectedRegistration(null)}
        />
      )}
    </div>
  )
}