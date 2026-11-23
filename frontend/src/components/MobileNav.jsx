import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './MobileNav.css'

export default function MobileNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = [{ path: '/', label: 'Events', end: true }]

  if (!user) {
    links.push(
      { path: '/login', label: 'Log in' },
      { path: '/register', label: 'Sign up' }
    )
  } else if (user.role === 'attendee') {
    links.push({ path: '/my-bookings', label: 'My bookings' })
  } else if (user.role === 'organizer' || user.role === 'admin') {
    links.push({ path: '/dashboard', label: 'Dashboard' })
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.end}
          className={({ isActive }) =>
            `mobile-bottom-nav__link${isActive ? ' is-active' : ''}`
          }
        >
          <span>{link.label}</span>
        </NavLink>
      ))}

      {user && (
        <button
          type="button"
          className="mobile-bottom-nav__link mobile-bottom-nav__logout"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
        >
          <img src="/icons/logout.svg" alt="" />
        </button>
      )}
    </nav>
  )
}
