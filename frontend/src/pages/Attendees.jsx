import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { events } from '../api/index.js'
import { formatDate } from '../lib/format.js'

export default function Attendees() {
  const { id } = useParams()

  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAttendees = async () => {
      try {
        const data = await events.attendees(id)

        setEvent(data.event)
        setAttendees(data.attendees)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAttendees()
  }, [id])

  if (loading) {
    return <p>Loading attendees…</p>
  }

  if (error) {
    return (
      <div>
        <h1>Attendees</h1>
        <p role="alert">{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div>
      <h1>Attendees</h1>

      <h2>{event.title}</h2>

      <p>
        Registered: {attendees.length} / {event.capacity}
      </p>

      {attendees.length === 0 ? (
        <p>No attendees have registered yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Registration date</th>
            </tr>
          </thead>

          <tbody>
            {attendees.map((attendee) => (
              <tr key={attendee.id}>
                <td>{attendee.name}</td>
                <td>{attendee.email}</td>
                <td>{formatDate(attendee.registered_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link to="/dashboard">Back to dashboard</Link>
    </div>
  )
}