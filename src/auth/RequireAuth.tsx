import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <div className="page-shell">Checking your session...</div>
  }

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
