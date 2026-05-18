import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { BrandLockup } from './BrandLockup'

export function AppShell() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <BrandLockup to="/dashboard" subtitle="Order portal" />

        <nav className="nav-links">
          <NavLink to="/dashboard">Overview</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/projects/new">New Request</NavLink>
        </nav>

        <div className="sidebar-footer">
          <p>{user?.name}</p>
          <span>{user?.role}</span>
          <button type="button" className="ghost-button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  )
}
