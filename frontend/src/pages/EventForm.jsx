import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { events, categories, venues } from '../api/index.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import './EventForm.css'

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', capacity: '', venue_id: '', category_id: '',
  })
  const [categoryList, setCategoryList] = useState([])
  const [venueList, setVenueList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const loadData = async () => {
      try {
        const [categoryData, venueData, eventData] = await Promise.all([
          categories.list(), venues.list(), isEditing ? events.get(id) : Promise.resolve(null),
        ])
        if (!active) return
        setCategoryList(categoryData.data)
        setVenueList(venueData.data)
        if (eventData) {
          const event = eventData.event
          const date = new Date(event.event_date)
          const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16)
          setForm({
            title: event.title, description: event.description || '',
            event_date: localDate, capacity: String(event.capacity),
            venue_id: String(event.venue_id), category_id: String(event.category_id),
          })
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [id, isEditing])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = {
        ...form,
        event_date: new Date(form.event_date).toISOString(),
        capacity: Number(form.capacity),
        venue_id: Number(form.venue_id),
        category_id: Number(form.category_id),
      }
      if (isEditing) await events.update(id, body)
      else await events.create(body)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing || deleting) return
    setDeleting(true)
    setError('')
    try {
      await events.delete(id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="event-form-status" role="status">Loading form…</p>

  return (
    <section className="event-editor">
      <nav className="event-editor__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Events</Link><span>/</span><span>{isEditing ? 'Edit event' : 'New event'}</span>
      </nav>
      <h1>{isEditing ? 'Edit event' : 'New event'}</h1>
      {error && <p className="event-editor__error" role="alert">{error}</p>}
      <div className="event-editor__layout">
        <form id="event-editor-form" className="event-editor__form" onSubmit={handleSubmit}>
          <div className="event-editor__field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" placeholder="Event title" value={form.title}
              onChange={handleChange} minLength={3} maxLength={150} required />
          </div>
          <div className="event-editor__field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" placeholder="What should people know before they book?"
              value={form.description} onChange={handleChange} maxLength={5000} rows={5} />
          </div>
          <div className="event-editor__field">
            <label htmlFor="event_date">Date and start time</label>
            <input id="event_date" name="event_date" type="datetime-local" value={form.event_date}
              onChange={handleChange} required />
          </div>
          <div className="event-editor__row">
            <div className="event-editor__field">
              <label htmlFor="venue_id">Venue</label>
              <select id="venue_id" name="venue_id" value={form.venue_id} onChange={handleChange} required>
                <option value="">Choose a venue</option>
                {venueList.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} — {venue.city}</option>)}
              </select>
            </div>
            <div className="event-editor__field">
              <label htmlFor="category_id">Category</label>
              <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange} required>
                <option value="">Choose a category</option>
                {categoryList.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
          </div>
          <div className="event-editor__field event-editor__capacity">
            <label htmlFor="capacity">Capacity (seats)</label>
            <input id="capacity" name="capacity" type="number" min="1" max="100000"
              value={form.capacity} onChange={handleChange} required />
          </div>
        </form>
        <aside className="event-editor__sidebar">
          <h2>Event actions</h2>
          <button className="event-editor__save" form="event-editor-form" type="submit" disabled={saving || deleting}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save event'}
          </button>
          <Link to="/dashboard" className="event-editor__cancel">Cancel</Link>
          {isEditing && (
            <div className="event-editor__danger">
              <span>Danger zone</span>
              <button type="button" disabled={saving || deleting} onClick={() => setConfirmDelete(true)}>Delete event</button>
            </div>
          )}
        </aside>
      </div>
      {confirmDelete && (
        <ConfirmDialog title="Delete event?" message="This will permanently delete the event and its registrations."
          confirmLabel="Delete event" busy={deleting} onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)} />
      )}
    </section>
  )
}
