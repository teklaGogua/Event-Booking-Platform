import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { events as eventsApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { formatDate, isPast } from '../lib/format.js'

export default function EventDetails() {
  const { id } = useParams()
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState('loading')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const load = useCallback(() => {
    return eventsApi.get(id)
      .then((data) => {
        setEvent(data.event)
        setStatus('ready')
      })
      .catch((err) => setStatus(err.status === 404 ? 'missing' : 'error'))
  }, [id])

  // Load on first visit, and again if the logged-in user changes
  useEffect(() => {
    load()
  }, [load, user?.id])

  // Runs register or cancel, then reloads the event so the numbers are fresh
  const run = async (action, successText) => {
    setBusy(true)
    setMessage(null)
    try {
      await action(id)
      await load()
      setMessage({ type: 'success', text: successText })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (status === 'loading') return <p>Loading…</p>
  if (status === 'missing') return <p>This event doesn’t exist.</p>
  if (status === 'error') return <p>Couldn’t load this event.</p>

  const registered = event.my_registration === 'registered'
  const past = isPast(event.event_date)

  // Decide which action area to show
  let action
  if (!user) {
    action = <Link to="/login">Log in to register</Link>
  } else if (user.role !== 'attendee') {
    action = <p>Only attendee accounts can register for events.</p>
  } else if (registered) {
    action = (
      <button onClick={() => setConfirming(true)} disabled={busy || past}>
        Cancel registration
      </button>
    )
  } else {
    action = (
      <button
        onClick={() => run(eventsApi.register, 'You are registered. See you there!')}
        disabled={busy || event.is_full || past}
      >
        {event.is_full ? 'Event is full' : 'Register'}
      </button>
    )
  }

  return (
    <div>
      <p><Link to="/">← All events</Link></p>

      <h1>{event.title}</h1>
      <p>{event.category_name}</p>
      <p>{formatDate(event.event_date)}</p>
      <p>{event.venue_name}, {event.venue_address}, {event.venue_city}</p>
      <p>{event.description || 'No description yet.'}</p>
      <p>Organized by {event.organizer_name}</p>

      <p>
        {event.is_full
          ? 'No spots left'
          : `${event.spots_left} of ${event.capacity} spots left`}
      </p>

      {past && <p>This event has already happened.</p>}
      {registered && <p>You are registered for this event.</p>}
      {message && <p role="status">{message.text}</p>}

      {action}

      {confirming && (
        <ConfirmDialog
          title="Cancel your registration?"
          message="Your spot will be released for someone else."
          confirmLabel="Cancel registration"
          busy={busy}
          onConfirm={() => run(eventsApi.cancel, 'Your registration was cancelled.')}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}