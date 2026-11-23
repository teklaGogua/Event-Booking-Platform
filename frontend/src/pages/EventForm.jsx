import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { events, categories, venues } from '../api/index.js'

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()

  const isEditing = Boolean(id)

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    capacity: '',
    venue_id: '',
    category_id: '',
  })

  const [categoryList, setCategoryList] = useState([])
  const [venueList, setVenueList] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load categories, venues and event data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoryData, venueData] = await Promise.all([
          categories.list(),
          venues.list(),
        ])

        setCategoryList(categoryData.data)
        setVenueList(venueData.data)

        // If editing, load the existing event
        if (isEditing) {
          const eventData = await events.get(id)
          const event = eventData.event

          // Convert event date into a format for datetime-local
          const date = new Date(event.event_date)
          const localDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16)

          setForm({
            title: event.title,
            description: event.description,
            event_date: localDate,
            capacity: String(event.capacity),
            venue_id: String(event.venue_id),
            category_id: String(event.category_id),
          })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isEditing])

  // Update form state when an input changes
  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Submit the form
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

      if (isEditing) {
        await events.update(id, body)
      } else {
        await events.create(body)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Loading form…</p>
  }

  return (
    <div>
      <h1>{isEditing ? 'Edit event' : 'Create event'}</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Event title</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            minLength={3}
            maxLength={150}
            required
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            maxLength={5000}
            rows={5}
          />
        </div>

        <div>
          <label htmlFor="category_id">Category</label>
          <select
            id="category_id"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
          >
            <option value="">Choose a category</option>

            {categoryList.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event_date">Date and time</label>
          <input
            id="event_date"
            name="event_date"
            type="datetime-local"
            value={form.event_date}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="venue_id">Venue</label>
          <select
            id="venue_id"
            name="venue_id"
            value={form.venue_id}
            onChange={handleChange}
            required
          >
            <option value="">Choose a venue</option>

            {venueList.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} — {venue.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="capacity">Capacity</label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            max="100000"
            value={form.capacity}
            onChange={handleChange}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving
            ? 'Saving…'
            : isEditing
              ? 'Save changes'
              : 'Create event'}
        </button>

        <Link to="/dashboard">Cancel</Link>
      </form>
    </div>
  )
}