
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      setMenuOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <nav className="navbar">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-icon">▱</span>
          <span>EventHub</span>
        </Link>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-content ${menuOpen ? 'nav-open' : ''}`}>
          <div className="nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
              onClick={closeMenu}
            >
              Events
            </NavLink>

            {user?.role === 'attendee' && (
              <NavLink
                to="/my-bookings"
                className="nav-link"
                onClick={closeMenu}
              >
                My bookings
              </NavLink>
            )}

            {(user?.role === 'organizer' || user?.role === 'admin') && (
              <NavLink
                to="/dashboard"
                className="nav-link"
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>
            )}

            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className="nav-link"
                onClick={closeMenu}
              >
                Admin
              </NavLink>
            )}
          </div>

          <div className="nav-user">
            {user ? (
              <>
                <span className="nav-user-name">{user.name}</span>
                <span className="role-badge">{user.role}</span>
                <button
                  className="logout-button"
                  onClick={handleLogout}
                  title="Log out"
                >
                  ↪
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-login" onClick={closeMenu}>
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="nav-register"
                  onClick={closeMenu}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
