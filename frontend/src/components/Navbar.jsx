import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="brand">
          <img src="/icons/ticket.svg" className="brand-icon" alt="" />
          <span>EventHub</span>
        </Link>

        <div className="nav-content">
          <div className="nav-links">
            <NavLink to="/" end className={navClass}>Events</NavLink>
            {user?.role === 'attendee' && (
              <NavLink to="/my-bookings" className={navClass}>My bookings</NavLink>
            )}
            {(user?.role === 'organizer' || user?.role === 'admin') && (
              <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navClass}>Admin</NavLink>
            )}
          </div>

          <div className="nav-user">
            {user ? (
              <>
                <span className="nav-user-name">{user.name}</span>
                <span className={`role-badge role-badge--${user.role}`}>
                  {user.role}
                </span>
                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                >
                  <img src="/icons/logout.svg" alt="" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-login">Log in</Link>
                <Link to="/register" className="nav-register">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
