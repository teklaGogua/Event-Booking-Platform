import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { events } from '../api/index.js'
import { formatDate } from '../lib/format.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()

  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Load the organizer's events
  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await events.mine()
      setMyEvents(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Delete an event
  const handleDelete = async () => {
    if (!selectedEvent) return

    try {
      setDeleteBusy(true)
      await events.delete(selectedEvent.id)

      setSelectedEvent(null)
      await loadEvents()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>

      <p>Welcome, {user?.name}!</p>

      <Link to="/events/new">
        <button>Create new event</button>
      </Link>

      <h2>My events</h2>

      {loading && <p>Loading events…</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && myEvents.length === 0 && (
        <p>You haven't created any events yet.</p>
      )}

      {!loading && myEvents.length > 0 && (
        <div>
          {myEvents.map((event) => (
            <article key={event.id}>
              <h3>{event.title}</h3>

              <p>{formatDate(event.event_date)}</p>

              <p>
                {event.venue_name}, {event.venue_city}
              </p>

              <p>
                Registered: {event.registered_count} / {event.capacity}
              </p>

              <Link to={`/events/${event.id}`}>
                View event
              </Link>

              {' '}

              <Link to={`/events/${event.id}/edit`}>
                Edit
              </Link>

              {' '}

              <button
                onClick={() => setSelectedEvent(event)}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedEvent && (
        <ConfirmDialog
          title="Delete event?"
          message={`Are you sure you want to delete "${selectedEvent.title}"? This will also remove its registrations.`}
          confirmLabel="Delete event"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}