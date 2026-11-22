import { useEffect, useState } from 'react'
import { events as eventsApi, categories as categoriesApi } from '../api/index.js'
import EventCard from '../components/EventCard.jsx'

export default function Events() {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [totalPages, setTotalPages] = useState(1)

  const [searchText, setSearchText] = useState('') 
  const [search, setSearch] = useState('')        
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)

  // Load the category list once, for the dropdown
  useEffect(() => {
    categoriesApi.list().then((data) => setCategories(data.data))
  }, [])

  // Load events again whenever the search, category or page changes
  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    const params = { include_past: 'false', page: String(page), limit: '2' }
    if (search) params.q = search
    if (categoryId) params.category_id = categoryId

    eventsApi.list(params)
      .then((data) => {
        if (cancelled) return
        setEvents(data.data)
        setTotalPages(data.total_pages)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    // If the filters change before this request finishes, ignore its result
    return () => { cancelled = true }
  }, [search, categoryId, page])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchText.trim())
    setPage(1)
  }

  const handleCategory = (e) => {
    setCategoryId(e.target.value)
    setPage(1)
  }

  return (
    <div>
      <h1>Events</h1>

      <form onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Search events"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button type="submit">Search</button>

        <select value={categoryId} onChange={handleCategory}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </form>

      {status === 'loading' && <p>Loading events…</p>}
      {status === 'error' && <p>Couldn’t load events. Is the backend running?</p>}
      {status === 'ready' && events.length === 0 && <p>No events found.</p>}

      {status === 'ready' && events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}

      {totalPages > 1 && (
        <p>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          {' '}Page {page} of {totalPages}{' '}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </p>
      )}
    </div>
  )
}