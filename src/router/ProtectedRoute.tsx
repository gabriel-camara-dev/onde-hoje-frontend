import { Navigate } from 'react-router-dom'
import type { UserRole } from '../@types/User'
import { useUserStore } from '../stores/userStore'

interface ProtectedRouteProps {
  children?: React.ReactNode
  requiredRole?: UserRole
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const accessToken = useUserStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}