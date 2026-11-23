import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Events from './pages/Events.jsx'
import EventDetails from './pages/EventDetails.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MyRegistrations from './pages/MyRegistrations.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EventForm from './pages/EventForm.jsx'
import Attendees from './pages/Attendees.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Events />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="my-bookings"
          element={
            <ProtectedRoute roles={['attendee']}>
              <MyRegistrations />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<p>Page not found.</p>} />
        <Route
          path="events/new"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <EventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="events/:id/edit"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <EventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="events/:id/attendees"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <Attendees />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}