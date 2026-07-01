import { Navigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

interface ProtectedRouteProps {
  children?: React.ReactNode
  requiredRole: 'ADMIN'
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const accessToken = useUserStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  } else if (user && user.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}
