import { useEffect, useState } from 'react'
import { categories, venues } from '../api/index.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('categories')

  const [categoryList, setCategoryList] = useState([])
  const [venueList, setVenueList] = useState([])

  const [categoryForm, setCategoryForm] = useState({ name: '' })

  const [venueForm, setVenueForm] = useState({
    name: '',
    address: '',
    city: '',
    capacity: '',
  })

  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedDelete, setSelectedDelete] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)

      const [categoryData, venueData] = await Promise.all([
        categories.list(),
        venues.list(),
      ])

      setCategoryList(categoryData.data)
      setVenueList(venueData.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setCategoryForm({ name: '' })
    setVenueForm({
      name: '',
      address: '',
      city: '',
      capacity: '',
    })
    setError('')
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (editingId) {
        await categories.update(editingId, categoryForm)
      } else {
        await categories.create(categoryForm)
      }

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
      const body = {
        ...venueForm,
        capacity: Number(venueForm.capacity),
      }

      if (editingId) {
        await venues.update(editingId, body)
      } else {
        await venues.create(body)
      }

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

      if (selectedDelete.type === 'category') {
        await categories.delete(selectedDelete.item.id)
      } else {
        await venues.delete(selectedDelete.item.id)
      }

      setSelectedDelete(null)
      await loadData()
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
    setVenueForm({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      capacity: String(venue.capacity),
    })
    setError('')
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <p>Manage event categories and venues.</p>

      <div>
        <button
          onClick={() => {
            setActiveTab('categories')
            resetForm()
          }}
        >
          Categories
        </button>

        <button
          onClick={() => {
            setActiveTab('venues')
            resetForm()
          }}
        >
          Venues
        </button>
      </div>

      {loading && <p>Loading management data…</p>}

      {!loading && activeTab === 'categories' && (
        <section>
          <h2>Categories</h2>

          <form onSubmit={handleCategorySubmit}>
            <label htmlFor="categoryName">Category name</label>

            <input
              id="categoryName"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ name: e.target.value })
              }
              minLength={2}
              maxLength={60}
              required
            />

            <button type="submit" disabled={saving}>
              {saving
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Add category'}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel editing
              </button>
            )}
          </form>

          <h3>Existing categories</h3>

          {categoryList.length === 0 && (
            <p>No categories available.</p>
          )}

          {categoryList.map((category) => (
            <article key={category.id}>
              <span>{category.name}</span>{' '}

              <button onClick={() => editCategory(category)}>
                Edit
              </button>{' '}

              <button
                onClick={() =>
                  setSelectedDelete({
                    type: 'category',
                    item: category,
                  })
                }
              >
                Delete
              </button>
            </article>
          ))}
        </section>
      )}

      {!loading && activeTab === 'venues' && (
        <section>
          <h2>Venues</h2>

          <form onSubmit={handleVenueSubmit}>
            <div>
              <label htmlFor="venueName">Venue name</label>
              <input
                id="venueName"
                value={venueForm.name}
                onChange={(e) =>
                  setVenueForm({
                    ...venueForm,
                    name: e.target.value,
                  })
                }
                minLength={2}
                maxLength={120}
                required
              />
            </div>

            <div>
              <label htmlFor="venueAddress">Address</label>
              <input
                id="venueAddress"
                value={venueForm.address}
                onChange={(e) =>
                  setVenueForm({
                    ...venueForm,
                    address: e.target.value,
                  })
                }
                minLength={2}
                maxLength={200}
                required
              />
            </div>

            <div>
              <label htmlFor="venueCity">City</label>
              <input
                id="venueCity"
                value={venueForm.city}
                onChange={(e) =>
                  setVenueForm({
                    ...venueForm,
                    city: e.target.value,
                  })
                }
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            <div>
              <label htmlFor="venueCapacity">Venue capacity</label>
              <input
                id="venueCapacity"
                type="number"
                min="1"
                max="1000000"
                value={venueForm.capacity}
                onChange={(e) =>
                  setVenueForm({
                    ...venueForm,
                    capacity: e.target.value,
                  })
                }
                required
              />
            </div>

            <button type="submit" disabled={saving}>
              {saving
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Add venue'}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel editing
              </button>
            )}
          </form>

          <h3>Existing venues</h3>

          {venueList.length === 0 && (
            <p>No venues available.</p>
          )}

          {venueList.map((venue) => (
            <article key={venue.id}>
              <h4>{venue.name}</h4>

              <p>{venue.address}, {venue.city}</p>

              <p>Capacity: {venue.capacity}</p>

              <button onClick={() => editVenue(venue)}>
                Edit
              </button>{' '}

              <button
                onClick={() =>
                  setSelectedDelete({
                    type: 'venue',
                    item: venue,
                  })
                }
              >
                Delete
              </button>
            </article>
          ))}
        </section>
      )}

      {error && <p role="alert">{error}</p>}

      {selectedDelete && (
        <ConfirmDialog
          title={`Delete ${selectedDelete.type}?`}
          message={`Are you sure you want to delete "${selectedDelete.item.name}"?`}
          confirmLabel="Delete"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setSelectedDelete(null)}
        />
      )}
    </div>
  )
}