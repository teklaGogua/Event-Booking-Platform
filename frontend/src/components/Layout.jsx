
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import MobileNav from './MobileNav.jsx'
import './Layout.css'

export default function Layout() {
  const { pathname } = useLocation()

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register'

  return (
    <div className="app-layout">
      {!isAuthPage && <Navbar />}

      <main className={isAuthPage ? 'auth-main' : 'page-main'}>
        <Outlet />
      </main>

      {!isAuthPage && <MobileNav />}
    </div>
  )
}
