import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { registrations as registrationsApi, events as eventsApi } from '../api/index.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import './MyRegistrations.css'

const knownCategories = new Set(['concert', 'conference', 'meetup', 'sports', 'workshop'])
const localized = (date, options) => new Intl.DateTimeFormat('en-GB', {
  ...options,
  timeZone: 'Asia/Tbilisi',
}).format(date)

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [cancelBusy, setCancelBusy] = useState(false)

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
    let active = true
    registrationsApi.mine()
      .then((data) => {
        if (!active) return
        setRegistrations(data.data)
        setStatus('ready')
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
        setStatus('error')
      })
    return () => { active = false }
  }, [])

  const handleCancel = async () => {
    if (!selectedRegistration || cancelBusy) return
    try {
      setCancelBusy(true)
      setError('')
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
    <section className="bookings-page">
      <h1>My tickets</h1>
      {error && <p className="bookings-alert" role="alert">{error}</p>}
      {status === 'loading' && <p className="bookings-status" role="status">Loading your bookings…</p>}
      {status === 'ready' && registrations.length === 0 && (
        <p className="bookings-status">You haven't booked any events yet. <Link to="/">Browse events</Link></p>
      )}
      {status === 'ready' && registrations.length > 0 && (
        <div className="bookings-grid">
          {registrations.map((registration) => {
            const category = registration.category_name?.trim().toLowerCase() || ''
            const theme = knownCategories.has(category) ? category : 'default'
            const date = new Date(registration.event_date)
            const validDate = !Number.isNaN(date.getTime())
            const active = registration.status === 'registered'
            return (
              <article className={`booking-ticket booking-ticket--${theme}`} key={registration.id}>
                <div className="booking-ticket__banner">
                  <span className="booking-ticket__eyebrow">
                    {registration.category_name || 'Event'} · {active ? 'Admit 1' : 'Cancelled'}
                  </span>
                  <h2>{registration.title}</h2>
                </div>
                <div className="booking-ticket__body">
                  <div className="booking-ticket__tear" aria-hidden="true" />
                  <div className="booking-ticket__metadata">
                    <div>
                      <span className="booking-ticket__label">Date</span>
                      <strong>{validDate ? localized(date, { day: '2-digit', month: 'short' }) : '—'}</strong>
                    </div>
                    <div>
                      <span className="booking-ticket__label">Time</span>
                      <strong>{validDate ? localized(date, { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}</strong>
                    </div>
                  </div>
                  <span className="booking-ticket__label">Address</span>
                  <p className="booking-ticket__venue">
                    {[registration.venue_name, registration.venue_address, registration.venue_city].filter(Boolean).join(', ') || 'Venue to be announced'}
                  </p>
                  <div className="booking-ticket__footer">
                    <Link to={`/events/${registration.event_id}`}>View event</Link>
                    {active && (
                      <button type="button" onClick={() => setSelectedRegistration(registration)}>
                        Cancel booking
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {selectedRegistration && (
        <ConfirmDialog title="Cancel booking?"
          message={`Are you sure you want to cancel your booking for "${selectedRegistration.title}"?`}
          confirmLabel="Cancel booking" busy={cancelBusy}
          onConfirm={handleCancel} onCancel={() => setSelectedRegistration(null)} />
      )}
    </section>
  )
}
