import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, venues, events } from '../api/index.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { formatDate } from '../lib/format.js'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('events')

  const [categoryList, setCategoryList] = useState([])
  const [venueList, setVenueList] = useState([])
  const [eventList, setEventList] = useState([])
  const [eventPage, setEventPage] = useState(1)
  const [eventPages, setEventPages] = useState(1)
  const [eventTotal, setEventTotal] = useState(0)
  const [eventSearchInput, setEventSearchInput] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [eventsLoading, setEventsLoading] = useState(false)

  const [categoryForm, setCategoryForm] = useState({ name: '' })
  const [venueForm, setVenueForm] = useState({ name: '', address: '', city: '', capacity: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedDelete, setSelectedDelete] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [categoryData, venueData] = await Promise.all([categories.list(), venues.list()])
      setCategoryList(categoryData.data)
      setVenueList(venueData.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      setEventsLoading(true)
      setError('')
      const data = await events.list({
        q: eventSearch || undefined,
        include_past: 'true',
        page: eventPage,
        limit: 50,
      })
      setEventList(data.data)
      setEventPages(data.total_pages || 1)
      setEventTotal(data.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setEventsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'events') loadEvents()
  }, [activeTab, eventPage, eventSearch])

  const resetForm = () => {
    setEditingId(null)
    setCategoryForm({ name: '' })
    setVenueForm({ name: '', address: '', city: '', capacity: '' })
    setError('')
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) await categories.update(editingId, categoryForm)
      else await categories.create(categoryForm)
      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleVenueSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = { ...venueForm, capacity: Number(venueForm.capacity) }
      if (editingId) await venues.update(editingId, body)
      else await venues.create(body)
      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDelete) return
    try {
      setDeleteBusy(true)
      if (selectedDelete.type === 'category') await categories.delete(selectedDelete.item.id)
      else if (selectedDelete.type === 'venue') await venues.delete(selectedDelete.item.id)
      else await events.delete(selectedDelete.item.id)
      setSelectedDelete(null)
      if (selectedDelete.type === 'event') await loadEvents()
      else await loadData()
    } catch (err) {
      setError(err.message)
      setSelectedDelete(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  const editCategory = (category) => {
    setActiveTab('categories')
    setEditingId(category.id)
    setCategoryForm({ name: category.name })
    setError('')
  }

  const editVenue = (venue) => {
    setActiveTab('venues')
    setEditingId(venue.id)
    setVenueForm({ name: venue.name, address: venue.address, city: venue.city, capacity: String(venue.capacity) })
    setError('')
  }

  const changeTab = (tab) => {
    setActiveTab(tab)
    resetForm()
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setEventPage(1)
    setEventSearch(eventSearchInput.trim())
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Manage all events, categories, and venues.</p>

      <div>
        <button onClick={() => changeTab('events')}>All Events</button>{' '}
        <button onClick={() => changeTab('categories')}>Categories</button>{' '}
        <button onClick={() => changeTab('venues')}>Venues</button>
      </div>

      {activeTab === 'events' && (
        <section>
          <h2>All Events</h2>
          <p>Total events: {eventTotal}</p>
          <p><Link to="/events/new">Create new event</Link></p>
          <form onSubmit={handleSearch}>
            <label htmlFor="adminEventSearch">Search events</label>{' '}
            <input
              id="adminEventSearch"
              value={eventSearchInput}
              onChange={(e) => setEventSearchInput(e.target.value)}
              placeholder="Search by title or description"
            />{' '}
            <button type="submit">Search</button>{' '}
            <button type="button" onClick={() => { setEventSearchInput(''); setEventPage(1); setEventSearch('') }}>Clear</button>
          </form>

          {eventsLoading && <p>Loading events…</p>}
          {!eventsLoading && eventList.length === 0 && <p>No events found.</p>}

          {!eventsLoading && eventList.map((event) => (
            <article key={event.id}>
              <h3>{event.title}</h3>
              <p>Organizer: {event.organizer_name}</p>
              <p>Date: {formatDate(event.event_date)}</p>
              <p>Venue: {event.venue_name}, {event.venue_city}</p>
              <p>Category: {event.category_name}</p>
              <p>Registrations: {event.registered_count} / {event.capacity}</p>
              <p>Status: {event.is_full ? 'Full' : `${event.spots_left} spots available`}</p>
              <Link to={`/events/${event.id}`}>View event</Link>{' | '}
              <Link to={`/events/${event.id}/attendees`}>View attendees</Link>{' | '}
              <Link to={`/events/${event.id}/edit`}>Edit</Link>{' '}
              <button onClick={() => setSelectedDelete({ type: 'event', item: event })}>Delete</button>
            </article>
          ))}

          {!eventsLoading && eventPages > 1 && (
            <div>
              <button disabled={eventPage <= 1} onClick={() => setEventPage((p) => p - 1)}>Previous</button>{' '}
              <span>Page {eventPage} of {eventPages}</span>{' '}
              <button disabled={eventPage >= eventPages} onClick={() => setEventPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </section>
      )}

      {loading && activeTab !== 'events' && <p>Loading management data…</p>}

      {!loading && activeTab === 'categories' && (
        <section>
          <h2>Categories</h2>
          <form onSubmit={handleCategorySubmit}>
            <label htmlFor="categoryName">Category name</label>
            <input id="categoryName" value={categoryForm.name} onChange={(e) => setCategoryForm({ name: e.target.value })} minLength={2} maxLength={60} required />
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add category'}</button>
            {editingId && <button type="button" onClick={resetForm}>Cancel editing</button>}
          </form>
          <h3>Existing categories</h3>
          {categoryList.length === 0 && <p>No categories available.</p>}
          {categoryList.map((category) => (
            <article key={category.id}>
              <span>{category.name}</span>{' '}
              <button onClick={() => editCategory(category)}>Edit</button>{' '}
              <button onClick={() => setSelectedDelete({ type: 'category', item: category })}>Delete</button>
            </article>
          ))}
        </section>
      )}

      {!loading && activeTab === 'venues' && (
        <section>
          <h2>Venues</h2>
          <form onSubmit={handleVenueSubmit}>
            <div><label htmlFor="venueName">Venue name</label><input id="venueName" value={venueForm.name} onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })} minLength={2} maxLength={120} required /></div>
            <div><label htmlFor="venueAddress">Address</label><input id="venueAddress" value={venueForm.address} onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} minLength={2} maxLength={200} required /></div>
            <div><label htmlFor="venueCity">City</label><input id="venueCity" value={venueForm.city} onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })} minLength={2} maxLength={100} required /></div>
            <div><label htmlFor="venueCapacity">Venue capacity</label><input id="venueCapacity" type="number" min="1" max="1000000" value={venueForm.capacity} onChange={(e) => setVenueForm({ ...venueForm, capacity: e.target.value })} required /></div>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add venue'}</button>
            {editingId && <button type="button" onClick={resetForm}>Cancel editing</button>}
          </form>
          <h3>Existing venues</h3>
          {venueList.length === 0 && <p>No venues available.</p>}
          {venueList.map((venue) => (
            <article key={venue.id}>
              <h4>{venue.name}</h4>
              <p>{venue.address}, {venue.city}</p>
              <p>Capacity: {venue.capacity}</p>
              <button onClick={() => editVenue(venue)}>Edit</button>{' '}
              <button onClick={() => setSelectedDelete({ type: 'venue', item: venue })}>Delete</button>
            </article>
          ))}
        </section>
      )}

      {error && <p role="alert">{error}</p>}

      {selectedDelete && (
        <ConfirmDialog
          title={`Delete ${selectedDelete.type}?`}
          message={selectedDelete.type === 'event'
            ? `Are you sure you want to delete "${selectedDelete.item.title}"? This will also remove its registrations.`
            : `Are you sure you want to delete "${selectedDelete.item.name}"?`}
          confirmLabel="Delete"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setSelectedDelete(null)}
        />
      )}
    </div>
  )
}
