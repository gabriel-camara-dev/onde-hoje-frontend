import { Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '../@types/User'
import { useUserStore } from '../stores/userStore'

interface ProtectedRouteProps {
  children?: React.ReactNode
  requiredRole?: UserRole
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation()
  const accessToken = useUserStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)

  if (!accessToken) {
    const returnTo = `${location.pathname}${location.search}`

    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}