import { Link } from 'react-router-dom'
import { formatDate } from '../lib/format.js'

export default function EventCard({ event }) {
  return (
    <article>
      <h3>
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>
      <p>{formatDate(event.event_date)}</p>
      <p>
        {event.venue_name}, {event.venue_city} · {event.category_name}
      </p>
      <p>{event.is_full ? 'Full' : `${event.spots_left} spots left`}</p>
    </article>
  )
}