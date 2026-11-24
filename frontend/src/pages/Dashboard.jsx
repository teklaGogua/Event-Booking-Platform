import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { events } from '../api/index.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Dashboard.css'

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  timeZone: 'Asia/Tbilisi',
})
const monthFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  timeZone: 'Asia/Tbilisi',
})
const weekdayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  timeZone: 'Asia/Tbilisi',
})
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Tbilisi',
})

function EventDate({ iso }) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return <div className="dashboard-event__date dashboard-event__date--unknown">Date TBA</div>
  }

  return (
    <div className="dashboard-event__date" aria-label={dateTimeFormat.format(date)}>
      <span>{monthFormat.format(date)}</span>
      <strong>{dayFormat.format(date)}</strong>
      <span>{weekdayFormat.format(date)}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const loadEvents = useCallback(async () => {
    try {
      setError('')
      const result = await events.mine()
      setMyEvents(Array.isArray(result.data) ? result.data : [])
    } catch (err) {
      setError(err.message || 'Could not load your events.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const handleDelete = async () => {
    if (!selectedEvent || deleteBusy) return

    try {
      setDeleteBusy(true)
      setError('')
      await events.delete(selectedEvent.id)
      setMyEvents((previous) => previous.filter((item) => item.id !== selectedEvent.id))
      setSelectedEvent(null)
    } catch (err) {
      setError(err.message || 'Could not delete this event.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {user?.name || 'Organizer'}!</p>
        </div>
        <Link className="dashboard-page__create" to="/events/new">
          Create new event
        </Link>
      </header>

      <div className="dashboard-page__section-title">
        <h2>My events</h2>
        {!loading && !error && <span>{myEvents.length} {myEvents.length === 1 ? 'event' : 'events'}</span>}
      </div>

      {loading && <p className="dashboard-page__message" role="status">Loading events…</p>}
      {error && <p className="dashboard-page__message dashboard-page__message--error" role="alert">{error}</p>}
      {!loading && myEvents.length === 0 && !error && (
        <div className="dashboard-page__empty">
          <p>You haven't created any events yet.</p>
          <Link to="/events/new">Create your first event</Link>
        </div>
      )}

      {!loading && myEvents.length > 0 && (
        <div className="dashboard-events">
          {myEvents.map((event) => {
            const date = new Date(event.event_date)
            const dateText = Number.isNaN(date.getTime()) ? 'Date to be announced' : dateTimeFormat.format(date)

            return (
              <article className="dashboard-event" key={event.id}>
                <EventDate iso={event.event_date} />

                <div className="dashboard-event__info">
                  <h3>{event.title}</h3>
                  <div className="dashboard-event__meta">
                    <span>
                      <img src="/icons/pin.svg" alt="" />
                      {[event.venue_name, event.venue_city].filter(Boolean).join(', ') || 'Venue to be announced'}
                    </span>
                    <span>
                      <img src="/icons/calendar.svg" alt="" />
                      {dateText}
                    </span>
                  </div>
                </div>

                <div className="dashboard-event__registrations">
                  <span>Registered</span>
                  <strong>{event.registered_count ?? 0} / {event.capacity ?? '—'}</strong>
                </div>

                <div className="dashboard-event__actions">
                  <Link className="dashboard-event__button" to={`/events/${event.id}`}>View event</Link>
                  <Link className="dashboard-event__button dashboard-event__button--plain" to={`/events/${event.id}/edit`}>Edit</Link>
                  <Link className="dashboard-event__button" to={`/events/${event.id}/attendees`}>View attendees</Link>
                  <button className="dashboard-event__button dashboard-event__button--danger" type="button" onClick={() => setSelectedEvent(event)}>Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {selectedEvent && (
        <ConfirmDialog
          title="Delete event?"
          message={`Are you sure you want to delete "${selectedEvent.title}"? This will also remove its registrations.`}
          confirmLabel="Delete event"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => { if (!deleteBusy) setSelectedEvent(null) }}
        />
      )}
    </section>
  )
}
