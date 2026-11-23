
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import './Layout.css'

export default function Layout() {
  const location = useLocation()

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register'

  return (
    <div className="app-layout">
      {!isAuthPage && <Navbar />}

      <main className={isAuthPage ? 'auth-main' : 'page-main'}>
        <Outlet />
      </main>
    </div>
  )
}
