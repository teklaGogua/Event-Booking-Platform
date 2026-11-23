
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './MobileNav.css'

function NavIcon({ name }) {
  const properties = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'events') {
    return (
      <svg {...properties}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 15 2-6 5-2-2 6-5 2Z" />
      </svg>
    )
  }

  if (name === 'ticket') {
    return (
      <svg {...properties}>
        <path d="M3 7h18v4a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Z" />
        <path d="M12 7v2m0 6v3" />
      </svg>
    )
  }

  if (name === 'login') {
    return (
      <svg {...properties}>
        <path d="m10 17 5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />
      </svg>
    )
  }

  return (
    <svg {...properties}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </svg>
  )
}

export default function MobileNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = [
    {
      path: '/',
      label: 'Events',
      icon: 'events',
      end: true,
    },
  ]

  if (!user) {
    links.push(
      {
        path: '/login',
        label: 'Log in',
        icon: 'login',
      },
      {
        path: '/register',
        label: 'Sign up',
        icon: 'user',
      }
    )
  } else if (user.role === 'attendee') {
    links.push({
      path: '/my-bookings',
      label: 'My bookings',
      icon: 'ticket',
    })
  } else if (
    user.role === 'organizer' ||
    user.role === 'admin'
  ) {
    links.push({
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'ticket',
    })
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
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile navigation"
    >
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
