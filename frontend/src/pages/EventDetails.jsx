import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { events as eventsApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { isPast } from '../lib/format.js'
import './EventDetails.css'

const categoryStyles = new Set(['concert', 'conference', 'meetup', 'sports', 'workshop'])
const dateParts = (date, options) => new Intl.DateTimeFormat('en-GB', {
  ...options,
  timeZone: 'Asia/Tbilisi',
}).format(date)

export default function EventDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState('loading')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const load = useCallback(async () => {
    const data = await eventsApi.get(id)
    setEvent(data.event)
    setStatus('ready')
  }, [id])

  useEffect(() => {
    let active = true
    eventsApi.get(id)
      .then((data) => {
        if (!active) return
        setEvent(data.event)
        setStatus('ready')
      })
      .catch((error) => {
        if (active) setStatus(error.status === 404 ? 'missing' : 'error')
      })
    return () => { active = false }
  }, [id, user?.id])

  const run = async (action, successText) => {
    if (busy) return
    setBusy(true)
    setMessage(null)
    try {
      await action(id)
      try {
        await load()
        setMessage({ type: 'success', text: successText })
      } catch {
        setMessage({ type: 'success', text: `${successText} Event information could not be refreshed.` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Something went wrong.' })
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (status === 'loading') return <p className="event-details-message" role="status">Loading event…</p>
  if (status === 'missing') return <p className="event-details-message">This event doesn't exist.</p>
  if (status === 'error' || !event) return <p className="event-details-message" role="alert">Couldn't load this event.</p>

  const category = event.category_name?.trim().toLowerCase() || ''
  const color = categoryStyles.has(category) ? category : 'default'
  const date = new Date(event.event_date)
  const validDate = !Number.isNaN(date.getTime())
  const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
  const registered = event.my_registration === 'registered'
  const past = !validDate || isPast(event.event_date)
  const spotsLeft = Math.max(0, Number(event.spots_left) || 0)
  const attendeeCount = Number(event.registered_count)

  let action
  if (!user) {
    action = <Link to="/login" className="event-details-action">Log in to register</Link>
  } else if (user.role !== 'attendee') {
    action = <p className="event-details-action-note">Only attendee accounts can register for events.</p>
  } else if (registered) {
    action = (
      <button type="button" className="event-details-action event-details-action--cancel"
        disabled={busy || past} onClick={() => setConfirming(true)}>
        Cancel registration
      </button>
    )
  } else {
    action = (
      <button type="button" className="event-details-action" disabled={busy || event.is_full || past}
        onClick={() => run(eventsApi.register, 'You are registered. See you there!')}>
        {busy ? 'Registering…' : past ? 'Event unavailable' : event.is_full ? 'Event is full' : 'Register'}
        <span className="event-details-action__arrow" aria-hidden="true">→</span>
      </button>
    )
  }

  return (
    <article className={`event-details event-details--${color}`}>
      <header className="event-details-hero">
        <Link to="/" className="event-details-back">
          <img src="/icons/arrowLeft.svg" alt="" />
          All events
        </Link>
        <div className="event-details-hero__content">
          <div className="event-details-date">
            <strong>{validDate ? dateParts(date, { day: '2-digit' }) : '—'}</strong>
            <span>{validDate ? dateParts(date, { month: 'short' }) : ''}</span>
          </div>
          <div className="event-details-hero__title">
            <span className="event-details-category">{event.category_name || 'Event'}</span>
            <h1>{event.title}</h1>
          </div>
          {Number.isFinite(attendeeCount) && (
            <span className="event-details-attendees">+{attendeeCount} going</span>
          )}
        </div>
      </header>

      <div className="event-details-content">
        <div className="event-details-main">
          <div className="event-details-info">
            <div className="event-details-info-item">
              <span className="event-details-info-icon"><img src="/icons/calendar.svg" alt="" /></span>
              <div>
                <strong>{validDate ? dateParts(date, dateOptions) : 'Date unavailable'}</strong>
                <span>{validDate ? dateParts(date, timeOptions) : 'Time unavailable'}</span>
              </div>
            </div>
            <div className="event-details-info-item">
              <span className="event-details-info-icon"><img src="/icons/pin.svg" alt="" /></span>
              <div>
                <strong>{event.venue_name || 'Venue to be announced'}</strong>
                <span>{[event.venue_address, event.venue_city].filter(Boolean).join(', ') || 'Location unavailable'}</span>
              </div>
            </div>
          </div>
          <section className="event-details-about">
            <h2>About this event</h2>
            <p>{event.description || 'No description yet.'}</p>
          </section>
          {event.organizer_name && <p className="event-details-organizer">Organized by <strong>{event.organizer_name}</strong></p>}
          {past && validDate && <p className="event-details-notice">This event has already happened.</p>}
          {registered && <p className="event-details-notice event-details-notice--success">You are registered for this event.</p>}
          {message && <p role="status" className={`event-details-notice event-details-notice--${message.type}`}>{message.text}</p>}
        </div>
        <aside className="event-details-sidebar">
          <div className="event-details-booking">
            <span className="event-details-booking__label">Seats left</span>
            <strong className="event-details-booking__count">{spotsLeft}</strong>
            {event.capacity != null && <p className="event-details-booking__capacity">Capacity: {event.capacity}</p>}
            <div className="event-details-booking__divider" />
            {action}
          </div>
        </aside>
      </div>
      {confirming && (
        <ConfirmDialog title="Cancel your registration?"
          message="Your spot will be released for someone else."
          confirmLabel="Cancel registration" busy={busy}
          onConfirm={() => run(eventsApi.cancel, 'Your registration was cancelled.')}
          onCancel={() => setConfirming(false)} />
      )}
    </article>
  )
}
