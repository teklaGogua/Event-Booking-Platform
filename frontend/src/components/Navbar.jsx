import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header>
      <nav>
        <Link to="/">EventHub</Link>{' | '}
        <NavLink to="/">Events</NavLink>

        {user?.role === 'attendee' && (
          <>{' | '}<NavLink to="/my-bookings">My bookings</NavLink></>
        )}
        {(user?.role === 'organizer' || user?.role === 'admin') && (
          <>{' | '}<NavLink to="/dashboard">Dashboard</NavLink></>
        )}
        {user?.role === 'admin' && (
          <>
            {' | '}
            <NavLink to="/admin">Admin</NavLink>
          </>
        )}

        <span style={{ float: 'right' }}>
          {user ? (
            <>
              {user.name} ({user.role}){' '}
              <button onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>{' | '}
              <Link to="/register">Sign up</Link>
            </>
          )}
        </span>
      </nav>
      <hr />
    </header>
  )
}