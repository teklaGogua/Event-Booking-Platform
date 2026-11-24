import { useEffect, useState } from 'react'
import { events as eventsApi, categories as categoriesApi } from '../api/index.js'
import EventCard from '../components/EventCard.jsx'
import './Events.css'

const ICONS = {
  concert: 'music.svg',
  conference: 'conferences.svg',
  meetup: 'meetup.svg',
  sports: 'sports.svg',
  workshop: 'workshop.svg',
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryError, setCategoryError] = useState(false)
  const [status, setStatus] = useState('loading')
  const [totalPages, setTotalPages] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    categoriesApi.list()
      .then((data) => { if (!cancelled) setCategories(data.data) })
      .catch(() => { if (!cancelled) setCategoryError(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    const params = { include_past: 'false', page: String(page), limit: '8' }
    if (search) params.q = search
    if (categoryId) params.category_id = categoryId

    eventsApi.list(params)
      .then((data) => {
        if (cancelled) return
        setEvents(data.data)
        setTotalPages(data.total_pages)
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })

    return () => { cancelled = true }
  }, [search, categoryId, page])

  const handleSearch = (event) => {
    event.preventDefault()
    setSearch(searchText.trim())
    setPage(1)
  }

  const chooseCategory = (id) => {
    setCategoryId(id)
    setPage(1)
  }

  return (
    <section className="events-page" aria-labelledby="events-title">
      <div className="events-page__header">
        <h1 id="events-title">What’s on in Tbilisi</h1>
        <form className="events-search" role="search" onSubmit={handleSearch}>
          <img src="/icons/search.svg" alt="" aria-hidden="true" />
          <input type="search" aria-label="Search events or venues" placeholder="Search events or venues" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="events-filters" role="group" aria-label="Filter by category">
        <button className={`events-filter events-filter--all ${categoryId === '' ? 'is-active' : ''}`} type="button" aria-pressed={categoryId === ''} onClick={() => chooseCategory('')}>All events</button>
        {categories.map((category) => {
          const key = category.name.trim().toLowerCase()
          const icon = ICONS[key]
          return (
            <button key={category.id} className={`events-filter events-filter--${ICONS[key] ? key : 'default'} ${String(categoryId) === String(category.id) ? 'is-active' : ''}`} type="button" aria-pressed={String(categoryId) === String(category.id)} onClick={() => chooseCategory(String(category.id))}>
              {icon && <img src={`/icons/${icon}`} alt="" aria-hidden="true" />}
              {category.name}
            </button>
          )
        })}
      </div>
      <div className="events-mobile-section-title">
        <h2>Upcoming events</h2>
        <button type="button" onClick={() => { chooseCategory(''); setSearch(''); setSearchText('') }}>See all</button>
      </div>
      {categoryError && <p className="events-message" role="status">Categories could not be loaded. All events are still available.</p>}

      {status === 'loading' && <p className="events-message" role="status">Loading events…</p>}
      {status === 'error' && <p className="events-message events-message--error" role="alert">Couldn’t load events. Check that the backend is running.</p>}
      {status === 'ready' && events.length === 0 && <p className="events-message">No upcoming events match your filters.</p>}
      {status === 'ready' && events.length > 0 && (
        <div className="events-grid">
          {events.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}

      {status === 'ready' && totalPages > 1 && (
        <nav className="events-pagination" aria-label="Events pages">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
        </nav>
      )}
    </section>
  )
}
