import { Link } from 'react-router-dom'
import './EventCard.css'

const CATEGORY_STYLES = {
  concert: 'concert',
  conference: 'conference',
  meetup: 'meetup',
  sports: 'sports',
  workshop: 'workshop',
}

function categoryStyle(name = '') {
  return CATEGORY_STYLES[name.trim().toLowerCase()] || 'default'
}

export default function EventCard({ event }) {
  const date = new Date(event.event_date)
  const validDate = !Number.isNaN(date.getTime())
  const dateNumber = validDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', timeZone: 'Asia/Tbilisi' }).format(date) : '—'
  const month = validDate ? new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Asia/Tbilisi' }).format(date) : ''
  const registered = Number(event.registered_count) || 0
  const venue = [event.venue_name, event.venue_city].filter(Boolean).join(', ')

  return (
    <article className={`event-card event-card--${categoryStyle(event.category_name)}`}>
      <div className="event-card__banner">
        <div className="event-card__date" aria-label={validDate ? date.toLocaleDateString('en-GB', { dateStyle: 'long', timeZone: 'Asia/Tbilisi' }) : 'Date unavailable'}>
          <strong>{dateNumber}</strong><span>{month}</span>
        </div>
        <h2 className="event-card__display-title">{event.title}</h2>
      </div>
      <div className="event-card__body">
        <h3 className="event-card__title">{event.title}</h3>
        <p className="event-card__attendance">{registered} going <span className="event-card__seat-status">{event.is_full ? '· Full' : `· ${event.spots_left} seats left`}</span></p>
        <p className="event-card__venue"><img src="/icons/pin.svg" alt="" aria-hidden="true" /> <span>{venue || 'Venue to be announced'}</span></p>
        <Link className="event-card__link" to={`/events/${event.id}`}>View details</Link>
      </div>
    </article>
  )
}
